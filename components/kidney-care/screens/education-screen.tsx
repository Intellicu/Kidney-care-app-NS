"use client"

import { useApp, getTranslations } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { FloatingAssistant } from "../floating-assistant"
import {
  ChevronLeft,
  Volume2,
  Play,
  Heart,
  TestTube,
  Utensils,
  AlertTriangle,
  X,
} from "lucide-react"
import { useState } from "react"

interface EducationTopic {
  id: string
  titleKey: "whatIsKidneyDisease" | "howToDoUrineTest" | "foodToEat" | "whenToGoHospital"
  icon: typeof Heart
  color: string
  content: {
    en: string
    hi: string
    bn: string
    ta: string
    pa: string
  }
}

const topics: EducationTopic[] = [
  {
    id: "kidney-disease",
    titleKey: "whatIsKidneyDisease",
    icon: Heart,
    color: "text-destructive bg-destructive/10",
    content: {
      en: "Kidneys are two bean-shaped organs that clean your blood. Kidney disease means your kidneys are damaged and cannot clean blood as well as they should. This can cause waste to build up in your body.",
      hi: "गुर्दे दो बीन के आकार के अंग हैं जो आपके खून को साफ करते हैं। गुर्दे की बीमारी का मतलब है कि आपके गुर्दे क्षतिग्रस्त हैं और खून को उतना साफ नहीं कर सकते जितना उन्हें करना चाहिए।",
      bn: "কিডনি হল দুটি বিন-আকৃতির অঙ্গ যা আপনার রক্ত পরিষ্কার করে। কিডনি রোগের অর্থ হল আপনার কিডনি ক্ষতিগ্রস্ত এবং রক্ত সঠিকভাবে পরিষ্কার করতে পারে না।",
      ta: "சிறுநீரகங்கள் உங்கள் இரத்தத்தை சுத்தம் செய்யும் இரண்டு பீன்-வடிவ உறுப்புகள். சிறுநீரக நோய் என்றால் உங்கள் சிறுநீரகங்கள் சேதமடைந்துள்ளன.",
      pa: "ਗੁਰਦੇ ਦੋ ਬੀਨ-ਆਕਾਰ ਦੇ ਅੰਗ ਹਨ ਜੋ ਤੁਹਾਡੇ ਖੂਨ ਨੂੰ ਸਾਫ਼ ਕਰਦੇ ਹਨ। ਗੁਰਦੇ ਦੀ ਬਿਮਾਰੀ ਦਾ ਮਤਲਬ ਹੈ ਕਿ ਤੁਹਾਡੇ ਗੁਰਦੇ ਖਰਾਬ ਹਨ।",
    },
  },
  {
    id: "urine-test",
    titleKey: "howToDoUrineTest",
    icon: TestTube,
    color: "text-primary bg-primary/10",
    content: {
      en: "1. Check the expiry date on the test strip\n2. Collect fresh urine in a clean cup\n3. Dip the strip for 1 second\n4. Remove and wipe the edge\n5. Wait 60 seconds\n6. Compare the color with the chart",
      hi: "1. टेस्ट स्ट्रिप पर समाप्ति तिथि जांचें\n2. साफ कप में ताजा मूत्र इकट्ठा करें\n3. 1 सेकंड के लिए पट्टी डुबोएं\n4. निकालें और किनारा पोंछें\n5. 60 सेकंड प्रतीक्षा करें\n6. चार्ट से रंग की तुलना करें",
      bn: "1. টেস্ট স্ট্রিপের মেয়াদ শেষের তারিখ পরীক্ষা করুন\n2. পরিষ্কার কাপে তাজা মূত্র সংগ্রহ করুন\n3. 1 সেকেন্ডের জন্য স্ট্রিপ ডুবান\n4. বের করুন এবং প্রান্ত মুছুন\n5. 60 সেকেন্ড অপেক্ষা করুন",
      ta: "1. டெஸ்ட் ஸ்ட்ரிப்பில் காலாவதி தேதியை சரிபாருங்கள்\n2. சுத்தமான கோப்பையில் புதிய சிறுநீரை சேகரிக்கவும்\n3. 1 வினாடி ஸ்ட்ரிப்பை நனைக்கவும்",
      pa: "1. ਟੈਸਟ ਸਟ੍ਰਿਪ 'ਤੇ ਮਿਆਦ ਦੀ ਤਾਰੀਖ ਚੈੱਕ ਕਰੋ\n2. ਸਾਫ਼ ਕੱਪ ਵਿੱਚ ਤਾਜ਼ਾ ਪਿਸ਼ਾਬ ਇਕੱਠਾ ਕਰੋ",
    },
  },
  {
    id: "food",
    titleKey: "foodToEat",
    icon: Utensils,
    color: "text-success bg-success/10",
    content: {
      en: "Good foods:\n- Fresh fruits and vegetables\n- Lean proteins (chicken, fish)\n- Rice and wheat\n\nFoods to limit:\n- Salt (namak)\n- Packaged foods\n- Too much water (ask your doctor)\n- Bananas, oranges (high potassium)",
      hi: "अच्छे खाद्य पदार्थ:\n- ताज़े फल और सब्ज़ियाँ\n- कम वसा वाला प्रोटीन (चिकन, मछली)\n- चावल और गेहूं\n\nसीमित करने वाले खाद्य पदार्थ:\n- नमक\n- पैकेज्ड फूड\n- बहुत अधिक पानी\n- केला, संतरा",
      bn: "ভালো খাবার:\n- তাজা ফল ও সবজি\n- কম চর্বিযুক্ত প্রোটিন\n- ভাত ও গম\n\nসীমিত করুন:\n- লবণ\n- প্যাকেজড খাবার",
      ta: "நல்ல உணவுகள்:\n- புதிய பழங்கள் மற்றும் காய்கறிகள்\n- குறைந்த கொழுப்புள்ள புரதங்கள்\n- அரிசி மற்றும் கோதுமை",
      pa: "ਚੰਗੇ ਭੋਜਨ:\n- ਤਾਜ਼ੇ ਫਲ ਅਤੇ ਸਬਜ਼ੀਆਂ\n- ਘੱਟ ਚਰਬੀ ਵਾਲੀ ਪ੍ਰੋਟੀਨ\n- ਚਾਵਲ ਅਤੇ ਕਣਕ",
    },
  },
  {
    id: "hospital",
    titleKey: "whenToGoHospital",
    icon: AlertTriangle,
    color: "text-warning bg-warning/10",
    content: {
      en: "Go to hospital immediately if you have:\n- Very little or no urine\n- Blood in urine\n- Severe swelling in legs or face\n- Difficulty breathing\n- Chest pain\n- Confusion or drowsiness\n- Very high blood pressure",
      hi: "तुरंत अस्पताल जाएं अगर आपको:\n- बहुत कम या बिल्कुल पेशाब न आए\n- पेशाब में खून\n- पैरों या चेहरे में गंभीर सूजन\n- सांस लेने में तकलीफ\n- छाती में दर्द\n- भ्रम या उनींदापन",
      bn: "অবিলম্বে হাসপাতালে যান যদি:\n- খুব কম বা কোনো প্রস্রাব না হয়\n- প্রস্রাবে রক্ত\n- পা বা মুখে তীব্র ফোলা\n- শ্বাস নিতে অসুবিধা",
      ta: "உடனடியாக மருத்துவமனைக்குச் செல்லுங்கள்:\n- மிகக் குறைவான அல்லது சிறுநீர் இல்லை\n- சிறுநீரில் இரத்தம்\n- கால்கள் அல்லது முகத்தில் கடுமையான வீக்கம்",
      pa: "ਤੁਰੰਤ ਹਸਪਤਾਲ ਜਾਓ ਜੇਕਰ:\n- ਬਹੁਤ ਘੱਟ ਜਾਂ ਬਿਲਕੁਲ ਪਿਸ਼ਾਬ ਨਹੀਂ\n- ਪਿਸ਼ਾਬ ਵਿੱਚ ਖੂਨ\n- ਲੱਤਾਂ ਜਾਂ ਚਿਹਰੇ ਵਿੱਚ ਗੰਭੀਰ ਸੋਜ",
    },
  },
]

interface TopicModalProps {
  isOpen: boolean
  onClose: () => void
  topic: EducationTopic | null
  language: "en" | "hi" | "bn" | "ta" | "pa"
}

function TopicModal({ isOpen, onClose, topic, language }: TopicModalProps) {
  const t = getTranslations(language)

  if (!isOpen || !topic) return null

  const Icon = topic.icon

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${topic.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-card-foreground">
              {t[topic.titleKey]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center touch-target"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Video/Image placeholder */}
          <div className="aspect-video bg-muted rounded-2xl mb-6 flex items-center justify-center">
            <button
              type="button"
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors touch-target"
            >
              <Play className="w-10 h-10 text-primary ml-1" />
            </button>
          </div>

          {/* Audio button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-primary/10 text-primary mb-6 touch-target"
          >
            <Volume2 className="w-6 h-6" />
            <span className="text-lg font-semibold">
              {language === "en"
                ? "Listen to this"
                : language === "hi"
                  ? "इसे सुनें"
                  : "Listen"}
            </span>
          </button>

          {/* Text content */}
          <div className="bg-muted rounded-2xl p-5">
            <p className="text-lg text-card-foreground leading-relaxed whitespace-pre-line">
              {topic.content[language]}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border shrink-0">
          <LargeButton onClick={onClose} variant="primary">
            {language === "en" ? "Got it!" : language === "hi" ? "समझ गया!" : "OK!"}
          </LargeButton>
        </div>
      </div>
    </div>
  )
}

export function EducationScreen() {
  const { language, setCurrentScreen } = useApp()
  const t = getTranslations(language)

  const [selectedTopic, setSelectedTopic] = useState<EducationTopic | null>(null)

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 pb-24 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => setCurrentScreen("dashboard")}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors touch-target"
          aria-label={t.back}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-bold text-foreground ml-4">{t.education}</h1>
      </div>

      {/* Topics grid */}
      <div className="grid grid-cols-2 gap-4">
        {topics.map((topic) => {
          const Icon = topic.icon

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className="bg-card rounded-2xl p-5 border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors touch-target min-h-[160px]"
            >
              <div
                className={`w-16 h-16 rounded-xl ${topic.color} flex items-center justify-center mb-4`}
              >
                <Icon className="w-8 h-8" />
              </div>
              <span className="text-lg font-semibold text-card-foreground leading-tight text-balance">
                {t[topic.titleKey]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Topic modal */}
      <TopicModal
        isOpen={selectedTopic !== null}
        onClose={() => setSelectedTopic(null)}
        topic={selectedTopic}
        language={language}
      />

      <FloatingAssistant />
    </div>
  )
}
