import { VertexAI } from '@google-cloud/vertexai'

interface GeneratedTask {
  title: string
  description: string
  estimatedMinutes: number
  priority: 'low' | 'medium' | 'high'
  required: boolean
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

export async function generateTasksFromDescription(description: string): Promise<GeneratedRoom[]> {
  const vertexAI = new VertexAI({
    project: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'passover',
    location: 'us-central1',
  })

  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-05-20',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })

  const prompt = `אתה מומחה ניקיון לפסח. בהינתן תיאור של בית, צור רשימת חדרים ומשימות ניקיון לפסח.

תיאור הבית:
${description}

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
          "required": true | false
        }
      ]
    }
  ]
}

הנחיות:
- צור משימות קטנות וספציפיות (5-30 דקות כל אחת), ידידותיות ל-ADHD
- כלול משימות אופייניות לניקיון פסח: בדיקת חמץ, ניקוי ארונות, מקרר, תנור, כיריים, וכו׳
- התאם את המשימות לתיאור הספציפי של הבית
- משימות חובה (required: true) הן אלו שקשורות ישירות להסרת חמץ
- המטבח צריך את מירב המשימות
- כל חדר צריך 3-8 משימות
- השתמש בעברית בלבד
- אל תוסיף חדרים שלא הוזכרו בתיאור (אלא אם מדובר בחדרים סטנדרטיים כמו מטבח)`

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
