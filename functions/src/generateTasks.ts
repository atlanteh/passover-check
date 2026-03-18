import { VertexAI } from '@google-cloud/vertexai'

interface GeneratedTask {
  title: string
  description: string
  estimatedMinutes: number
  priority: 'low' | 'medium' | 'high'
  required: boolean
  checklist?: string[]
}

interface GeneratedRoom {
  name: string
  icon: string
  tasks: GeneratedTask[]
}

const ICON_MAP: Record<string, string> = {
  'מטבח': 'kitchen',
  'סלון': 'livingRoom',
  'חדר שינה': 'bedroom',
  'חדר אמבטיה': 'bathroom',
  'שירותים': 'bathroom',
  'חדר ילדים': 'childRoom',
  'משרד': 'office',
  'פינת אוכל': 'diningRoom',
  'מכבסה': 'laundry',
  'מחסן': 'storage',
  'מרפסת': 'balcony',
  'חניה': 'garage',
  'כניסה': 'entrance',
}

function guessIcon(roomName: string): string {
  for (const [keyword, icon] of Object.entries(ICON_MAP)) {
    if (roomName.includes(keyword)) return icon
  }
  return 'other'
}

export async function generateTasksFromDescription(description: string, existingRooms?: string[]): Promise<GeneratedRoom[]> {
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'passover'
  const vertexAI = new VertexAI({
    project,
    location: 'global',
    apiEndpoint: 'aiplatform.googleapis.com',
  })

  const model = vertexAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })

  const existingRoomsSection = existingRooms?.length
    ? `\nחדרים קיימים במערכת (השתמש בשמות זהים בדיוק כדי להוסיף משימות לחדרים קיימים):\n${existingRooms.map((r) => `- ${r}`).join('\n')}\n`
    : ''

  const prompt = `אתה עוזר לארגן ניקיון פסח. המשתמש מתאר את החדרים והמשימות שהוא רוצה לבצע. תפקידך לארגן את מה שהוא כתב לפורמט מובנה — בלי להמציא חדרים או משימות שלא הוזכרו.

תיאור מהמשתמש:
${description}
${existingRoomsSection}
צור תשובה בפורמט JSON הבא:
{
  "rooms": [
    {
      "name": "שם החדר בעברית",
      "tasks": [
        {
          "title": "שם המשימה בעברית",
          "description": "תיאור קצר בעברית",
          "estimatedMinutes": 15,
          "priority": "high" | "medium" | "low",
          "required": true | false,
          "checklist": ["פריט 1", "פריט 2"]
        }
      ]
    }
  ]
}

הנחיות:
- ארגן רק את מה שהמשתמש תיאר. אל תמציא חדרים או משימות שלא הוזכרו
- פרק משימות גדולות למשימות קטנות וספציפיות (5-30 דקות), ידידותיות ל-ADHD
- כאשר משימה כוללת פריטים חוזרים (מגירות, מדפים, ארונות), הוסף רשימת checklist עם הפריטים
- checklist הוא מערך אופציונלי של מחרוזות
- משימות חובה (required: true) הן אלו שקשורות ישירות להסרת חמץ
- השתמש בעברית בלבד
- אם יש חדרים קיימים במערכת שמתאימים לתיאור, השתמש בשמות הזהים שלהם`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No response from AI')
  }

  const parsed = JSON.parse(text) as { rooms: Array<{ name: string; tasks: GeneratedTask[] }> }

  // Add icons
  return parsed.rooms.map((room) => ({
    name: room.name,
    icon: guessIcon(room.name),
    tasks: room.tasks,
  }))
}
