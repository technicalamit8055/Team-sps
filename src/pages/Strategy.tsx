import React, { useState } from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, FileText, Megaphone, Mic, MessageSquare, Shield, Sparkles, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const aiTools = [
  { id: 'manifesto', label: 'घोषणापत्र', icon: <FileText className="w-5 h-5" />, prompt: 'Generate a manifesto' },
  { id: 'social', label: 'सोशल मीडिया', icon: <Megaphone className="w-5 h-5" />, prompt: 'Create social media post' },
  { id: 'ivr', label: 'IVR स्क्रिप्ट', icon: <Mic className="w-5 h-5" />, prompt: 'Write IVR script' },
  { id: 'slogan', label: 'नारे', icon: <MessageSquare className="w-5 h-5" />, prompt: 'Generate slogans' },
  { id: 'speech', label: 'भाषण', icon: <Sparkles className="w-5 h-5" />, prompt: 'Write speech' },
  { id: 'rumor', label: 'अफवाह खंडन', icon: <Shield className="w-5 h-5" />, prompt: 'Counter rumors' },
];

const demoResponses: Record<string, string> = {
  manifesto: `# विकास का वादा - घोषणापत्र 2025

## 🏗️ बुनियादी ढांचा
- हर गली में पक्की सड़क
- 24 घंटे बिजली आपूर्ति
- स्वच्छ पेयजल की व्यवस्था

## 👨‍👩‍👧‍👦 सामाजिक कल्याण
- वृद्धों के लिए पेंशन योजना
- महिलाओं के लिए स्वरोजगार केंद्र
- युवाओं के लिए कौशल विकास

## 🌾 कृषि
- किसानों को उचित मूल्य
- सिंचाई सुविधाओं का विस्तार
- कृषि यंत्रों पर सब्सिडी

**हमारा वादा है - विकास, सम्मान, समृद्धि!**`,

  social: `🗳️ महेशपुर पंचायत के प्रिय मतदाताओं!

आपका साथ, हमारा विश्वास! 🤝

इस चुनाव में आपका एक वोट बदल सकता है हमारे गांव की तस्वीर:
✅ बेहतर सड़कें
✅ स्वच्छ पानी
✅ रोशन गलियां
✅ बेहतर शिक्षा

#विकास_की_लहर #महेशपुर_बदलेगा #जीत_पक्की

🔶 चुनाव चिह्न याद रखें!
📅 मतदान तिथि: 20 जनवरी 2025`,

  ivr: `[IVR Script - Hindi]

नमस्कार! मैं राजेश कुमार, महेशपुर पंचायत से।

आपका कीमती वोट मांगने आया हूं।

पिछले सालों में हमने मिलकर किया:
- सड़कों का निर्माण
- स्कूल का नवीनीकरण  
- पानी की टंकी का निर्माण

इस बार भी आपके साथ और भी विकास करना चाहते हैं।

20 जनवरी को अपना कीमती वोट देना न भूलें।

धन्यवाद! जय हिंद! 🇮🇳`,

  slogan: `🔥 चुनावी नारे:

1. "विकास की लहर है, राजेश कुमार है!"

2. "गांव का विकास, जनता का विश्वास!"

3. "सबका साथ, सबका विकास - महेशपुर की आवाज!"

4. "जो करे काम, उसे दो सम्मान!"

5. "बदलाव की बयार, इस बार राजेश कुमार!"

6. "पानी, सड़क, बिजली का वादा - राजेश भैया का इरादा!"

7. "किसान, मजदूर, नौजवान - सबका है एक ही मान!"`,

  speech: `# जनसभा भाषण

**"जय हिंद! जय भारत!"**

मेरे प्यारे भाइयों और बहनों,

सबसे पहले आप सभी को मेरा प्रणाम! 🙏

आज मैं आपके बीच खड़ा हूं, आपका सेवक बनकर, आपके साथी बनकर।

पिछले पांच सालों में हमने मिलकर क्या-क्या किया, आप सब जानते हैं:
- गांव की हर गली पक्की हुई
- स्कूल में नई छत लगी
- पानी की समस्या हल हुई

लेकिन अभी और भी बहुत काम बाकी है। इसीलिए आपके साथ की जरूरत है।

**20 जनवरी को अपना कीमती वोट जरूर दें!**

जय हिंद! जय महेशपुर! 🇮🇳`,

  rumor: `# अफवाह खंडन

❌ **अफवाह:** "उम्मीदवार ने विकास कार्य नहीं किए"

✅ **सच्चाई:** 
पिछले 5 वर्षों में किए गए कार्य:
- 15 किमी पक्की सड़क
- 3 हैंडपंप की मरम्मत
- स्कूल भवन का नवीनीकरण
- 50 शौचालयों का निर्माण

📋 सभी कार्यों का रिकॉर्ड पंचायत कार्यालय में उपलब्ध है।

⚠️ **अपील:** भ्रामक अफवाहों पर विश्वास न करें। सच्चाई जानने के लिए सीधे संपर्क करें।

📞 हेल्पलाइन: 98765-43210`,
};

export const Strategy: React.FC = () => {
  const { data } = useVictory();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (toolId: string) => {
    setIsLoading(true);
    setSelectedTool(toolId);
    
    // Simulate AI response with demo data
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const response = demoResponses[toolId] || 'AI response will appear here when API is configured.';
    setOutput(response.replace(/राजेश कुमार/g, data.settings.candidateName).replace(/महेशपुर/g, data.settings.constituency.split(' ')[0]));
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('कॉपी हो गया!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI वॉर रूम</h1>
          <p className="text-muted-foreground">रणनीति और कंटेंट जनरेशन</p>
        </div>
      </div>

      {/* Demo Mode Notice */}
      <div className="glass-panel p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">
            डेमो मोड - AI API कॉन्फ़िगर करने के लिए Settings में जाएं
          </span>
        </div>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {aiTools.map((tool) => (
          <Button
            key={tool.id}
            variant="outline"
            className={`h-auto flex-col gap-2 p-4 ${selectedTool === tool.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleGenerate(tool.id)}
            disabled={isLoading}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {tool.icon}
            </div>
            <span className="text-sm font-medium">{tool.label}</span>
          </Button>
        ))}
      </div>

      {/* Custom Prompt */}
      <div className="glass-panel p-4">
        <label className="text-sm font-medium mb-2 block">कस्टम प्रॉम्प्ट</label>
        <Textarea
          placeholder="अपना प्रॉम्प्ट यहां लिखें..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="min-h-[100px]"
        />
        <Button
          className="btn-saffron mt-3"
          disabled={!customPrompt.trim() || isLoading}
          onClick={() => {
            setOutput('आपका कस्टम AI रिस्पॉन्स यहां आएगा। API कॉन्फ़िगर करने के बाद यह काम करेगा।');
            setSelectedTool('custom');
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              जनरेट हो रहा है...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              जनरेट करें
            </>
          )}
        </Button>
      </div>

      {/* Output */}
      {output && (
        <div className="glass-panel p-4 animate-slide-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">AI आउटपुट</h3>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              कॉपी
            </Button>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-sans">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
