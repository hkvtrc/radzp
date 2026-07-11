import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Lock, 
  Unlock, 
  Phone, 
  Check, 
  Shield, 
  MessageSquare, 
  Image as ImageIcon, 
  Clock, 
  Users, 
  MapPin, 
  Heart, 
  PhoneCall, 
  ShieldAlert, 
  AlertTriangle, 
  Loader2, 
  MoreVertical, 
  Video, 
  Send 
} from 'lucide-react';

// Format phone number utility: (XX) XXXXX-XXXX
const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 3) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

export default function App() {
  const [step, setStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [phone, setPhone] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [generationTime, setGenerationTime] = useState('');
  const [detectedCity, setDetectedCity] = useState('Maracaí');

  useEffect(() => {
    // Try silent IP-based geolocating first for smooth and reliable user experience
    const fetchCityByIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data && data.city) {
            setDetectedCity(data.city);
            return true;
          }
        }
      } catch (err) {
        console.warn('IP-based geolocation failed, falling back to browser geolocation', err);
      }
      return false;
    };

    // Browser geolocation fallback
    const fetchCityByBrowserGeo = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county;
              if (city) {
                setDetectedCity(city);
              }
            }
          } catch (err) {
            console.error('Browser geolocation reverse geocoding failed', err);
          }
        },
        (error) => {
          console.warn('Browser geolocation permission or request failed', error);
        }
      );
    };

    fetchCityByIP().then((success) => {
      if (!success) {
        fetchCityByBrowserGeo();
      }
    });
  }, []);

  // 10-second analysis timeline config
  const analysisSteps = [
    { title: 'Mensagens apagadas', desc: 'Conversas excluídas', icon: MessageSquare },
    { title: 'Fotos e vídeos privados', desc: 'Imagens em conversas privadas', icon: ImageIcon },
    { title: 'Última conexão real', desc: 'Horário exato mesmo que oculto', icon: Clock },
    { title: 'Contatos e grupos ocultos', desc: 'Pessoas e grupos em segredo', icon: Users },
    { title: 'Localização em tempo real', desc: 'Localização compartilhada detectada', icon: MapPin },
  ];

  // Initialize generation time once results are loaded
  useEffect(() => {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setGenerationTime(formatted);
  }, [step]);

  // Handle analysis simulation (at most 10 seconds total)
  useEffect(() => {
    if (step !== 'analyzing') return;

    setProgress(0);
    setCompletedSteps([]);
    setCurrentStepIndex(0);

    const duration = 8500; // 8.5 seconds total duration
    const intervalTime = 50;
    const increment = (100 / (duration / intervalTime));

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + increment, 100);
        
        // Calculate step completions based on progress thresholds
        const stepIndex = Math.floor(next / 20);
        setCurrentStepIndex(Math.min(stepIndex, 4));

        const newCompleted: number[] = [];
        for (let i = 0; i < 5; i++) {
          if (next >= (i + 1) * 19.5) {
            newCompleted.push(i);
          }
        }
        setCompletedSteps(newCompleted);

        if (next >= 100) {
          clearInterval(timer);
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [step]);

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length < 10) {
      triggerToast('Por favor, insira um número de WhatsApp válido.');
      return;
    }
    setStep('analyzing');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleVerEncontrados = () => {
    if (progress < 100) {
      triggerToast('Aguarde a análise de segurança ser 100% concluída...');
    } else {
      setStep('results');
    }
  };

  // Pricing box component to reuse (Image 7)
  const CheckoutCard = () => (
    <div id="pricing-card" className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center my-6 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#eefaf0] flex items-center justify-center mb-4 border border-[#e2f5e6]">
        <div className="relative">
          <div className="absolute inset-0 bg-[#59ca64] opacity-20 rounded-full animate-ping"></div>
          <svg className="w-10 h-10 text-[#4cb857]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
      </div>

      <div className="text-xl font-black text-[#111e2e] tracking-tight mb-2">
        ZapRadar
      </div>

      <p className="text-[#51637c] text-sm leading-relaxed mb-5 font-medium px-4">
        Com o <span className="text-[#4cb857] font-bold">ZapRadar</span> você terá acesso completo ao WhatsApp do seu parceiro por apenas:
      </p>

      <div className="bg-[#fcfdfe] rounded-2xl p-5 border border-[#edf3f8] w-full mb-5 flex flex-col items-center">
        <span className="text-red-500 text-sm font-semibold line-through mb-1">
          De: R$99,00
        </span>
        <div className="flex items-baseline text-[#4cb857] font-black">
          <span className="text-2xl mr-1">R$</span>
          <span className="text-5xl tracking-tight">27</span>
          <span className="text-xl ml-1">,00</span>
        </div>
      </div>

      <a 
        href="https://www.test.com" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="w-full bg-[#59ca64] hover:bg-[#4cb857] text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-[#59ca64]/30 hover:shadow-xl hover:shadow-[#59ca64]/40 flex items-center justify-center gap-2 text-base active:scale-95 duration-150 cursor-pointer"
      >
        <Unlock className="w-5 h-5" />
        DESBLOQUEAR ACESSO AGORA
      </a>

      <div className="grid grid-cols-2 gap-2 w-full mt-5">
        <div className="bg-[#f4faf5] border border-[#e3f4e6] rounded-xl py-2 px-3 flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 text-[#4cb857]" />
          <span className="text-[#367c3f] font-bold text-xs">Garantia 30 dias</span>
        </div>
        <div className="bg-[#f4faf5] border border-[#e3f4e6] rounded-xl py-2 px-3 flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 text-[#4cb857]" />
          <span className="text-[#367c3f] font-bold text-xs">Acesso por 1 ano</span>
        </div>
        <div className="bg-[#f4faf5] border border-[#e3f4e6] rounded-xl py-2 px-3 flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 text-[#4cb857]" />
          <span className="text-[#367c3f] font-bold text-xs">Até 3 números</span>
        </div>
        <div className="bg-[#f4faf5] border border-[#e3f4e6] rounded-xl py-2 px-3 flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 text-[#4cb857]" />
          <span className="text-[#367c3f] font-bold text-xs">100% anônimo</span>
        </div>
      </div>
      
      <p className="text-[#8c9cae] text-xs font-semibold mt-4 flex items-center gap-1">
        <Shield className="w-3.5 h-3.5 text-[#8c9cae]" />
        Transação 100% segura e anônima
      </p>
    </div>
  );

  return (
    <div id="app-container" className="min-h-screen bg-[#f4f6f8] flex justify-center items-start overflow-y-auto font-sans antialiased text-slate-800">
      
      {/* Simulation Smartphone Container (Mobile First wrapper for desktop) */}
      <div id="smartphone-frame" className="w-full max-w-md min-h-screen md:min-h-[850px] md:my-6 md:rounded-[40px] md:shadow-2xl md:border-8 md:border-slate-800 bg-[#f4f6f8] relative overflow-hidden flex flex-col justify-between transition-all">
        
        {/* Dynamic header depending on the step */}
        {step === 'results' && (
          <header className="bg-[#141724] border-b border-[#212638] py-4 px-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-white font-extrabold text-sm tracking-widest uppercase">ZapRadar Relatório Secreto</span>
          </header>
        )}

        {/* Content Wrapper */}
        <main className="flex-1 p-5 overflow-y-auto">
          
          {/* STEP 1: PHONE NUMBER INPUT SCREEN */}
          {step === 'input' && (
            <div id="input-screen" className="flex flex-col items-center justify-center py-8">
              
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 w-full flex flex-col items-center">
                
                {/* Visual Icon Header */}
                <div className="w-20 h-20 rounded-full bg-[#f4faf5] flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-[#59ca64] opacity-5 rounded-full animate-pulse"></div>
                  <svg className="w-11 h-11 text-[#59ca64]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>

                <h1 className="text-[#111e2e] font-extrabold text-2xl text-center leading-tight mb-2">
                  O que seu parceiro faz no <span className="text-[#59ca64] font-black">WhatsApp?</span>
                </h1>

                <p className="text-[#707e94] text-sm text-center mb-6 leading-relaxed font-medium">
                  Insira o número que deseja espionar. Descubra mensagens, fotos e localização em tempo real.
                </p>

                <form onSubmit={handleStartAnalysis} className="w-full">
                  <div className="mb-4">
                    <label className="text-[#73829b] text-xs font-bold tracking-wider mb-2.5 flex items-center gap-1.5">
                      📱 NÚMERO DO WHATSAPP
                    </label>
                    <div className="flex">
                      {/* Fixed prefix badge */}
                      <div className="bg-[#f0f4f9] text-[#111e2e] font-bold py-3.5 px-4 rounded-2xl mr-2 text-base border border-[#e2e8f0] flex items-center justify-center min-w-[70px]">
                        +55
                      </div>
                      
                      {/* Formatted Text input */}
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-8765"
                        maxLength={15}
                        className="bg-white border border-[#e2e8f0] text-base text-[#111e2e] py-3.5 px-4 rounded-2xl flex-1 placeholder-[#a0aec0] font-semibold outline-none focus:border-[#59ca64] focus:ring-1 focus:ring-[#59ca64] transition-all shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* ESPIONAR AGORA Button */}
                  <button 
                    type="submit"
                    className="w-full bg-[#59ca64] hover:bg-[#4cb857] text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#59ca64]/30 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] duration-150 mt-6 text-base"
                  >
                    <Eye className="w-5 h-5" />
                    ESPIONAR AGORA
                  </button>
                </form>

                {/* Secure footer */}
                <div className="text-[#73829b] text-xs font-semibold text-center mt-6 flex items-center justify-center gap-1.5 py-2 border-t border-gray-50 w-full">
                  <Lock className="w-3.5 h-3.5 text-[#59ca64]" />
                  <span>100% anônimo • Sem rastros • Criptografado</span>
                </div>

              </div>

            </div>
          )}

          {/* STEP 2: LOADING / ANALYSIS SCREEN */}
          {step === 'analyzing' && (
            <div id="analyzing-screen" className="flex flex-col py-2">
              
              {/* Green Floating Header (🔓 CLIQUE PARA VER O QUE ENCONTRAMOS) */}
              <button 
                onClick={handleVerEncontrados}
                className={`w-full py-4 px-6 rounded-2xl mb-6 text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all border ${
                  progress >= 100 
                  ? 'bg-gradient-to-r from-[#59ca64] to-[#4cb857] border-[#4cb857] shadow-[#59ca64]/30 animate-bounce cursor-pointer' 
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 border-gray-400 opacity-90 cursor-not-allowed'
                }`}
              >
                {progress >= 100 ? <Unlock className="w-4 h-4 animate-pulse" /> : <Lock className="w-4 h-4" />}
                CLIQUE PARA VER O QUE ENCONTRAMOS
              </button>

              {/* Central Analysis Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col w-full">
                
                {/* Header with Circular Meter */}
                <div className="flex items-center gap-4 pb-5 border-b border-gray-100 mb-5">
                  
                  {/* Circle Meter */}
                  <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke="#f0f4f9" 
                        strokeWidth="4" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke="#59ca64" 
                        strokeWidth="4" 
                        fill="transparent" 
                        strokeDasharray={175} 
                        strokeDashoffset={175 - (175 * progress) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                    
                    {/* Circle Center User Outline */}
                    <div className="w-11 h-11 bg-[#f0f4f9] rounded-full flex items-center justify-center">
                      <Users className="w-5.5 h-5.5 text-[#73829b]" />
                    </div>
                  </div>

                  {/* Phone and analyzing tag */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[#111e2e] font-extrabold text-lg truncate">
                      +55 {phone || '(11) 99999-8765'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#59ca64] animate-ping"></span>
                      <span className="text-[#59ca64] text-xs font-bold">
                        {progress >= 100 ? 'Análise finalizada' : 'Sendo analisado agora'}
                      </span>
                    </div>
                  </div>

                  {/* Percentage Counter */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[#59ca64] text-xl font-black block">
                      {Math.round(progress)}%
                    </span>
                    <span className="text-[#8c9cae] text-[10px] font-bold uppercase tracking-wider block">
                      {progress >= 100 ? 'Pronto!' : 'Análise'}
                    </span>
                  </div>

                </div>

                {/* Sub banner Checkbox */}
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 mb-6 transition-all duration-300 ${
                  progress >= 100 
                  ? 'bg-[#eefaf0] border-[#c0ebd1] text-[#296839]' 
                  : 'bg-[#fafbfe] border-[#e2e8f0] text-[#73829b]'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={progress >= 100} 
                    readOnly
                    className="mt-0.5 w-4 h-4 accent-[#59ca64] rounded cursor-default" 
                  />
                  <p className="text-xs font-bold leading-relaxed">
                    Investigação completa. Clique no botão acima para descobrir a verdade.
                  </p>
                </div>

                {/* Analyzing item list (Sequential checks) */}
                <div className="flex flex-col gap-4">
                  {analysisSteps.map((stepItem, index) => {
                    const isCompleted = completedSteps.includes(index);
                    const isAnalyzing = currentStepIndex === index && progress < 100;
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                          isCompleted 
                          ? 'bg-[#fafdfa] border-[#e2f3e4]' 
                          : isAnalyzing 
                          ? 'bg-[#f4f7fa] border-[#c8dbec] scale-[1.01]' 
                          : 'bg-white border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Item Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isCompleted 
                            ? 'bg-[#eefaf0] text-[#4cb857]' 
                            : isAnalyzing 
                            ? 'bg-[#e8f1fc] text-[#3182ce]' 
                            : 'bg-[#f7fafc] text-[#a0aec0]'
                          }`}>
                            <stepItem.icon className="w-5 h-5" />
                          </div>

                          {/* Titles */}
                          <div>
                            <div className={`text-sm font-extrabold ${isCompleted ? 'text-slate-800' : 'text-slate-600'}`}>
                              {stepItem.title}
                            </div>
                            <div className="text-slate-400 text-xs font-medium">
                              {stepItem.desc}
                            </div>
                          </div>
                        </div>

                        {/* Status Checkbox on Right side */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <div className="w-6 h-6 bg-[#59ca64] rounded-full flex items-center justify-center shadow-sm shadow-[#59ca64]/30">
                              <Check className="w-4 h-4 text-white stroke-[3.5]" />
                            </div>
                          ) : isAnalyzing ? (
                            <Loader2 className="w-5.5 h-5.5 text-[#3182ce] animate-spin" />
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Bottom Lock Info */}
                <div className="mt-8 flex flex-col items-center border-t border-gray-50 pt-5 text-center">
                  <div className="w-9 h-9 bg-[#fcf9ee] border border-[#f5edd2] rounded-full flex items-center justify-center mb-2">
                    <Lock className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-[#111e2e] text-xs font-bold mb-0.5">
                    Esta ferramenta é 100% anônima
                  </div>
                  <div className="text-[#8c9cae] text-[10px] font-semibold">
                    Não responda mensagens para se manter discreto.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* STEP 3: RESULTS SCREEN */}
          {step === 'results' && (
            <div id="results-screen" className="flex flex-col gap-5 py-2">
              
              {/* 1. Red warning card (Image 3 Header block) */}
              <div className="bg-[#9c2317] bg-gradient-to-br from-[#ac2b1e] to-[#881a10] rounded-3xl p-5 shadow-xl text-white flex flex-col items-center text-center relative overflow-hidden border border-red-500/30">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full transform translate-x-8 -translate-y-8"></div>
                
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
                  <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
                </div>

                <h2 className="text-lg font-black tracking-tight leading-snug mb-2 flex items-center gap-1.5 justify-center">
                  ⚠️ SEU RELACIONAMENTO PODE ESTAR EM PERIGO!
                </h2>

                <p className="text-red-100 text-xs leading-relaxed font-semibold px-2">
                  Nosso algoritmo baseado em dados, utilizando palavras e fotos, detectou mensagens e arquivos suspeitos no WhatsApp de <span className="underline font-extrabold decoration-yellow-400 decoration-2">+55 {phone || '(11) 99999-8765'}</span>
                </p>
              </div>

              {/* 2. Number investigated card (Image 3 middle row) */}
              <div className="bg-white rounded-3xl p-4 shadow-md border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-500">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Users className="w-4.5 h-4.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[#111e2e] font-black text-base">+55 {phone || '(11) 99999-8765'}</h3>
                    <p className="text-slate-400 text-xs font-semibold">Número investigado</p>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 py-1 px-2.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-emerald-700 text-[10px] font-extrabold uppercase">WhatsApp ativo</span>
                </div>
              </div>

              {/* 3. Location / precision card (Image 3 bottom row) */}
              <div className="bg-[#fafbfd] border border-gray-100 rounded-3xl p-5 shadow-sm text-center">
                <p className="text-slate-600 text-xs leading-relaxed font-bold mb-3">
                  Nosso sistema detectou que este número se comunica frequentemente com uma pessoa localizada perto de <span className="text-[#ff5e3a] font-extrabold">{detectedCity}</span>
                </p>
                <div className="inline-flex items-center gap-1.5 bg-[#eefaf0] border border-[#c0ebd1] py-1.5 px-4 rounded-full mb-2">
                  <Check className="w-4 h-4 text-[#4cb857] stroke-[3]" />
                  <span className="text-[#296839] text-xs font-extrabold">Precisão do relatório: 98%</span>
                </div>
                <div className="text-slate-400 text-[10px] font-bold tracking-tight">
                  Relatório gerado em: {generationTime}
                </div>
              </div>

              {/* 4. Analysis Results (Image 4 Dark Blue panel) */}
              <div className="bg-[#181a24] rounded-3xl p-5 shadow-2xl text-slate-100 border border-[#262c3f]">
                
                <h3 className="text-center font-black text-lg text-white mb-5 tracking-wide border-b border-[#212638] pb-3">
                  Resultados da análise
                </h3>

                {/* Dark lists */}
                <div className="flex flex-col gap-3.5">
                  
                  {/* Item 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2a1b24] flex items-center justify-center flex-shrink-0 text-pink-500 border border-pink-500/10">
                      <MessageSquare className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      Encontramos <span className="text-red-400 font-extrabold">58</span> mensagens suspeitas no WhatsApp
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2d281a] flex items-center justify-center flex-shrink-0 text-amber-500 border border-amber-500/10">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500"></div>
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      <span className="text-red-400 font-extrabold">36</span> mensagens contendo a palavra <span className="text-red-400 font-bold">"gostoso"</span>
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2e1d21] flex items-center justify-center flex-shrink-0 text-red-500 border border-red-500/10">
                      <Heart className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      <span className="text-red-400 font-extrabold">41</span> mensagens contendo a palavra <span className="text-red-400 font-bold">"amor"</span>
                    </p>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2d281a] flex items-center justify-center flex-shrink-0 text-amber-500 border border-amber-500/10">
                      <ImageIcon className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      <span className="text-red-400 font-extrabold">20</span> fotos e <span className="text-red-400 font-extrabold">5</span> vídeos estão escondidos por uma senha no telefone
                    </p>
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1e2336] flex items-center justify-center flex-shrink-0 text-indigo-400 border border-indigo-400/10">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-400"></div>
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      <span className="text-indigo-400 font-extrabold">8</span> mensagens contendo a palavra <span className="text-red-400 font-bold">"segredo"</span>
                    </p>
                  </div>

                  {/* Item 6 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1b2b23] flex items-center justify-center flex-shrink-0 text-emerald-400 border border-emerald-400/10">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      Há um <span className="text-white font-extrabold">contato não registrado</span> que envia frequentemente várias mensagens e diz que sente <span className="text-red-400 font-bold">saudade</span>
                    </p>
                  </div>

                  {/* Item 7 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1d2736] flex items-center justify-center flex-shrink-0 text-blue-400 border border-blue-400/10">
                      <Eye className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      <span className="text-blue-400 font-extrabold">9</span> imagens recebidas em <span className="text-white font-extrabold">visualização única</span> foram identificadas e restauradas
                    </p>
                  </div>

                  {/* Item 8 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2e1d1d] flex items-center justify-center flex-shrink-0 text-rose-500 border border-rose-500/10">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      <span className="text-rose-400 font-extrabold">7</span> locais suspeitos foram detectados nas proximidades de <span className="text-red-400 font-bold">{detectedCity}</span>
                    </p>
                  </div>

                  {/* Item 9 */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2d281a] flex items-center justify-center flex-shrink-0 text-amber-500 border border-amber-500/10">
                      <PhoneCall className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pt-1.5">
                      <span className="text-amber-400 font-extrabold">2</span> conversas arquivadas foram marcadas como <span className="text-red-400 font-bold">suspeitas</span>
                    </p>
                  </div>

                </div>

                {/* Bottom dark-green pill badge (Espionagem 100% concluida!) */}
                <div className="mt-6 bg-[#254c3c] border border-[#2b634c] py-3.5 px-4 rounded-2xl text-center">
                  <div className="text-emerald-300 text-sm font-extrabold mb-1 tracking-wide">
                    Espionagem 100% concluída!
                  </div>
                  <div className="text-slate-300 text-xs font-semibold">
                    Encontramos conteúdo comprometedor no WhatsApp de +55 {phone || '(11) 99999-8765'}
                  </div>
                </div>

              </div>

              {/* 5. PLACE THE CHECKOUT INTERMEDIATE (Image 7 between results as requested) */}
              <CheckoutCard />

              {/* 6. Recupere Mensagens Excluidas (Image 5) */}
              <div className="bg-[#181a24] rounded-3xl p-5 shadow-xl text-slate-100 border border-[#262c3f]">
                
                {/* Red banner style badge label */}
                <div className="inline-flex items-center gap-1.5 bg-[#421d23] border border-[#5c1c27] py-1 px-3 rounded-full mb-3 text-[10px] text-red-400 font-black tracking-wider uppercase">
                  <Clock className="w-3 h-3 text-red-400" />
                  MENSAGENS APAGADAS ENCONTRADAS
                </div>

                <h3 className="text-white font-extrabold text-base leading-tight mb-2">
                  Recuperamos <span className="text-[#59ca64] font-black">mensagens excluídas</span> do WhatsApp de +55 {phone || '(11) 99999-8765'}
                </h3>

                <p className="text-slate-400 text-xs leading-relaxed font-semibold mb-5">
                  Conversas que foram apagadas mas que nosso sistema conseguiu recuperar. +55 {phone || '(11) 99999-8765'} não sabe que as temos.
                </p>

                {/* Mockup WhatsApp Device chat with blurred bubbles */}
                <div className="bg-[#0b141a] rounded-2xl border border-[#232d36] overflow-hidden relative min-h-[360px] flex flex-col">
                  
                  {/* Chat Header */}
                  <div className="bg-[#202c33] px-3.5 py-3 flex items-center justify-between border-b border-[#2d3a42]/30 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-slate-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        💬
                      </div>
                      <div className="leading-tight">
                        <div className="text-white font-bold text-xs truncate max-w-[130px]">+55 {phone || '(11) 99999-8765'}</div>
                        <div className="text-emerald-400 text-[9px] font-bold animate-pulse">online</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Video className="w-4.5 h-4.5" />
                      <Phone className="w-4 h-4" />
                      <MoreVertical className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-3 flex flex-col gap-3 justify-end pb-12 select-none pointer-events-none">
                    
                    {/* Message 1: Incoming */}
                    <div className="bg-[#202c33] rounded-2xl rounded-tl-none p-3 max-w-[80%] self-start relative shadow-sm">
                      <p className="text-xs text-white leading-relaxed blur-[4px]">
                        Nosso amor mais do que com tanta saudade ❤️
                      </p>
                      <span className="text-[8px] text-slate-400 font-semibold absolute bottom-1.5 right-2">14:21</span>
                    </div>

                    {/* Message 2: Outgoing */}
                    <div className="bg-[#005c4b] rounded-2xl rounded-tr-none p-3 max-w-[80%] self-end relative shadow-sm">
                      <p className="text-xs text-white leading-relaxed blur-[4px]">
                        Tambem to com muita saudade, mas voce sabe que nao e facil pra mim sair...
                      </p>
                      <span className="text-[8px] text-slate-300 font-semibold absolute bottom-1.5 right-2">14:22</span>
                    </div>

                    {/* Message 3: Incoming */}
                    <div className="bg-[#202c33] rounded-2xl rounded-tl-none p-3 max-w-[80%] self-start relative shadow-sm">
                      <p className="text-xs text-white leading-relaxed blur-[4px]">
                        Eu sei amor, mas da um jeito de vir me ver hoje 😏
                      </p>
                      <span className="text-[8px] text-slate-400 font-semibold absolute bottom-1.5 right-2">14:23</span>
                    </div>

                  </div>

                  {/* Encrypted cover/Locked Overlay in the center of the chats */}
                  <div className="absolute inset-0 bg-[#0b141a]/65 backdrop-blur-[2.5px] flex flex-col items-center justify-center p-6 text-center select-all cursor-pointer">
                    <div className="bg-[#202c33]/90 border border-[#2d383e] p-5 rounded-2xl shadow-xl flex flex-col items-center max-w-[240px]">
                      <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-3 text-red-400">
                        <Lock className="w-5.5 h-5.5 stroke-[2.5]" />
                      </div>
                      <div className="text-white font-extrabold text-sm mb-1">
                        Conversa bloqueada
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed font-semibold">
                        Clique em desbloquear para liberar o acesso a todas as conversas apagadas.
                      </p>
                    </div>
                  </div>

                  {/* Chat bottom typing input bar */}
                  <div className="bg-[#202c33] p-2 flex items-center gap-2 border-t border-[#2d3a42]/30 flex-shrink-0 absolute bottom-0 left-0 right-0">
                    <div className="bg-[#2a3942] rounded-full px-3 py-1.5 flex-1 text-[10px] text-slate-400 font-medium select-none">
                      Escreva uma mensagem...
                    </div>
                    <div className="w-7 h-7 bg-[#00a884] rounded-full flex items-center justify-center text-white">
                      <Send className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>

                </div>

              </div>

              {/* 7. Fotos Privadas Interceptadas (Image 6) */}
              <div className="bg-[#181a24] rounded-3xl p-5 shadow-xl text-slate-100 border border-[#262c3f]">
                
                {/* Gold banner style badge label */}
                <div className="inline-flex items-center gap-1.5 bg-[#42331d] border border-[#5c441c] py-1 px-3 rounded-full mb-3 text-[10px] text-amber-500 font-black tracking-wider uppercase">
                  <ImageIcon className="w-3 h-3 text-amber-500" />
                  FOTOS PRIVADAS INTERCEPTADAS
                </div>

                <h3 className="text-white font-extrabold text-base leading-tight mb-2">
                  Encontramos <span className="text-[#4cb857] font-black">fotos enviadas em privado</span> por +55 {phone || '(11) 99999-8765'}
                </h3>

                <p className="text-slate-400 text-xs leading-relaxed font-semibold mb-5">
                  Imagens enviadas em conversas privadas que <span className="text-amber-500">desaparecem após serem abertas</span>. Já as guardamos para você.
                </p>

                {/* Grid layout with blurred mock-suggestive files */}
                <div className="grid grid-cols-3 gap-2.5 relative select-none">
                  
                  {/* Column Left (Main square) */}
                  <div className="col-span-2 aspect-square rounded-2xl bg-slate-900 border border-[#2c344a] overflow-hidden relative">
                    {/* Simulated blurred body outline layout */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#3b2d2d] via-[#4d3a3a] to-[#5a4c3a] blur-[22px]"></div>
                    <div className="absolute inset-x-8 top-12 bottom-4 bg-[#7a5a54] rounded-full filter blur-[15px] opacity-40"></div>
                    
                    {/* Padlock center overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                      <div className="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white mb-1.5 shadow-md">
                        <Lock className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-white text-xs font-bold tracking-wide">Bloqueada</span>
                    </div>
                  </div>

                  {/* Column Right (Two stacked smaller squares) */}
                  <div className="col-span-1 flex flex-col gap-2.5">
                    
                    {/* Square 1 */}
                    <div className="aspect-square rounded-xl bg-slate-900 border border-[#2c344a] overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2f3942] to-[#4c3b2d] blur-[15px]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Square 2 */}
                    <div className="aspect-square rounded-xl bg-slate-900 border border-[#2c344a] overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#3d2f42] to-[#422d33] blur-[15px]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* 8. SECOND INSTANCE OF CHECKOUT CARD FOR EASY ACCESSIBILITY */}
              <CheckoutCard />

            </div>
          )}

        </main>

        {/* Unified sleek workspace footer */}
        <footer className="py-4 px-6 text-center border-t border-gray-100 bg-white/50 backdrop-blur-sm mt-auto">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            © 2026 ZapRadar • Todos os direitos reservados
          </p>
        </footer>

      </div>

      {/* Floating Interactive Toast Feedback */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#1e2230] border border-[#2c344a] text-slate-100 py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[290px] text-center animate-bounce">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-xs font-bold leading-relaxed">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
