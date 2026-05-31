import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, XCircle, Info, ChevronRight, Globe, Loader2, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { fileToBase64, analyzeImage } from './services/geminiService';
import { FoodAnalysisResult, Language, RiskLevel } from './types';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.ZH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  const handleLanguageToggle = () => {
    setLanguage(prev => prev === Language.ZH ? Language.EN : Language.ZH);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setSelectedImage(objectUrl);

      // Convert and send to API
      const base64 = await fileToBase64(file);
      const data = await analyzeImage(base64, language);
      setResult(data);
    } catch (err) {
      setError(language === Language.ZH ? '分析失败，请重试' : 'Analysis failed, please try again');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setSelectedImage(null);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const renderRiskBadge = (level: RiskLevel) => {
    switch(level) {
      case RiskLevel.SAFE:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{t.safe}</span>;
      case RiskLevel.MODERATE:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{t.moderate}</span>;
      case RiskLevel.HIGH:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{t.high}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{t.unknown}</span>;
    }
  };

  // Chart Data
  const chartData = result ? [
    { name: 'Score', value: result.healthScore },
    { name: 'Remaining', value: 100 - result.healthScore }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-10">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           {result && (
             <button onClick={resetAnalysis} className="mr-2 p-1 hover:bg-gray-100 rounded-full">
               <ArrowLeft size={24} />
             </button>
           )}
           <div className="bg-brand-500 text-white p-1.5 rounded-lg">
             <CheckCircle2 size={20} />
           </div>
           <h1 className="text-xl font-bold tracking-tight text-gray-900">{t.title}</h1>
        </div>
        <button 
          onClick={handleLanguageToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
        >
          <Globe size={16} />
          {language === Language.ZH ? 'English' : '中文'}
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6">
        
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*"
          capture="environment" // Direct camera on mobile
          className="hidden" 
          onChange={handleFileUpload}
        />

        {/* Upload State */}
        {!result && !loading && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-brand-50 mx-auto rounded-full flex items-center justify-center mb-4 text-brand-500">
                <Camera size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t.uploadTitle}</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {t.uploadDesc}
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={triggerCamera}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  {t.takePhoto}
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-white border-2 border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={20} />
                  {t.uploadGallery}
                </button>
              </div>
            </div>

            {/* Quick Tips or Placeholder content could go here */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
              <Info className="text-blue-500 shrink-0" />
              <p className="text-sm text-blue-800">
                {language === Language.ZH 
                  ? "提示：请确保光线充足，文字清晰可见。尽量包含完整的配料表区域。" 
                  : "Tip: Ensure good lighting and clear text. Try to include the full ingredient list."}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
              {selectedImage && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img src={selectedImage} alt="preview" className="w-full h-full object-cover opacity-50" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t.analyzing}</h3>
              <p className="text-gray-500 mt-2">{t.analyzingDesc}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={resetAnalysis}
              className="px-6 py-2 bg-white border border-red-200 text-red-700 rounded-lg font-medium shadow-sm"
            >
              {t.reset}
            </button>
          </div>
        )}

        {/* Result View */}
        {result && !loading && (
          <div className="space-y-6 pb-20 animate-fade-in-up">
            
            {/* Score Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-3xl font-black" style={{ color: getScoreColor(result.healthScore) }}>
                    {result.healthScore}
                  </h2>
                  <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">{t.score}</p>
                </div>
                {/* Gauge Chart */}
                <div className="w-24 h-24 -mt-2 -mr-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={35}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell key="score" fill={getScoreColor(result.healthScore)} cornerRadius={10} />
                        <Cell key="bg" fill="#f3f4f6" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mt-2">
                 <p className="text-gray-700 text-sm leading-relaxed font-medium">
                   "{result.summary}"
                 </p>
              </div>
            </div>

            {/* Nutrition Facts (Optional) */}
            {result.nutritionFacts && Object.keys(result.nutritionFacts).length > 0 && (
               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Info size={18} className="text-blue-500" /> {t.nutrition}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {result.nutritionFacts.calories && (
                      <div className="bg-blue-50 p-2 rounded-lg text-center">
                        <div className="text-xs text-blue-600 uppercase">Calories</div>
                        <div className="font-bold text-blue-900">{result.nutritionFacts.calories}</div>
                      </div>
                    )}
                    {result.nutritionFacts.sugar && (
                      <div className="bg-blue-50 p-2 rounded-lg text-center">
                        <div className="text-xs text-blue-600 uppercase">Sugar</div>
                        <div className="font-bold text-blue-900">{result.nutritionFacts.sugar}</div>
                      </div>
                    )}
                    {result.nutritionFacts.fat && (
                       <div className="bg-blue-50 p-2 rounded-lg text-center">
                        <div className="text-xs text-blue-600 uppercase">Fat</div>
                        <div className="font-bold text-blue-900">{result.nutritionFacts.fat}</div>
                      </div>
                    )}
                    {result.nutritionFacts.sodium && (
                      <div className="bg-blue-50 p-2 rounded-lg text-center">
                        <div className="text-xs text-blue-600 uppercase">Sodium</div>
                        <div className="font-bold text-blue-900">{result.nutritionFacts.sodium}</div>
                      </div>
                    )}
                  </div>
               </div>
            )}

            {/* Allergens Warning */}
            {result.allergens.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm mb-1">{t.allergens}</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.allergens.map((allergen, i) => (
                      <span key={i} className="bg-white text-red-700 border border-red-200 px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Additives Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-lg text-gray-800">{t.additives}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {result.additives.length === 0 ? (
                   <div className="p-6 text-center text-gray-400 text-sm">No significant additives found.</div>
                ) : (
                  result.additives.map((additive, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-800">{additive.name} {additive.code && <span className="text-xs text-gray-400 font-normal">({additive.code})</span>}</span>
                        {renderRiskBadge(additive.riskLevel as RiskLevel)}
                      </div>
                      <div className="text-xs text-brand-600 font-semibold mb-1 uppercase tracking-wide">{additive.function}</div>
                      <p className="text-sm text-gray-500 leading-snug">{additive.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Standard Analysis Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-lg mb-4 text-gray-800">{t.standards}</h3>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 font-bold text-xs text-red-800 border border-red-100">CN</div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{t.gb}</h4>
                    <p className="text-sm text-gray-500">{result.standardsAnalysis.gb_china}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 font-bold text-xs text-blue-800 border border-blue-100">EU</div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{t.eu}</h4>
                    <p className="text-sm text-gray-500">{result.standardsAnalysis.eu_standard}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 font-bold text-xs text-indigo-800 border border-indigo-100">US</div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{t.us}</h4>
                    <p className="text-sm text-gray-500">{result.standardsAnalysis.us_fda}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Ingredients List */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
               <h3 className="font-bold text-lg mb-3 text-gray-800">{t.ingredients}</h3>
               <div className="flex flex-wrap gap-2">
                 {result.ingredients.map((ing, i) => (
                   <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                     {ing}
                   </span>
                 ))}
               </div>
            </div>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-6 left-0 right-0 px-4 max-w-md mx-auto z-40">
              <button 
                onClick={resetAnalysis}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-xl shadow-gray-200 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Camera size={18} />
                {t.reset}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;