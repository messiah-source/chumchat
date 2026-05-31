import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const TICKER_MESSAGES = [
  '!Бюро клавиатурных воинов +73556081337',
  '!Продаю шахту с кристалами. lvl: 57 warrior',
  '!Куплю скилл, продам жизнь. id: qwe666qq',
  '!Научусь готовить пельмени. Радужный городок: Мафиозник',
  '!Приведи друга и получи колоду архивариуса. Промокод: shalnoypalcevert7',
  '!Ищу пациента для пересадки сердца моей плотвы. Алексей Геральдович 47 лет',
  '!Точну арку до +1. Цена 700ккк. Ник: JLobnuiGnom3000',
];

export default function Landing() {
  const faceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (faceRef.current) {
        faceRef.current.style.backgroundImage = "url('/assets/CHUM_EBALO_NYA.png')";
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/CHUM_FON.png')" }}
    >
      <div
        className="relative mx-auto select-none"
        style={{
          minWidth: 682,
          maxWidth: 980,
          minHeight: '100vh',
          backgroundColor: '#142940',
          boxShadow: '10px 0 0 0 #0E1C2B, -10px 0 0 0 #0E1C2B',
          backgroundImage: "url('/assets/CHUM_INSIDEFON.png')",
          backgroundPosition: 'center',
          backgroundSize: '70%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* LEFT SIDE DECORATION */}
        <div className="absolute left-0 top-0 bottom-0 w-48 pointer-events-none">
          <img src="/assets/CHUM_LEFTSIDE.png" alt="" className="w-full h-full object-cover" />
        </div>

        {/* RIGHT SIDE DECORATION */}
        <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none">
          <img src="/assets/CHUM_RIGHTSIDE.png" alt="" className="w-full h-full object-cover" />
        </div>

        {/* KEYBOARD LOGO top-left */}
        <div className="absolute top-8 left-12 z-10">
          <div className="relative">
            <img src="/assets/CHUM_CHUT.png" alt="CHUM" className="w-40" />
            <div className="absolute -top-4 left-2 flex gap-0.5">
              {(['C', 'H', 'U', 'M'] as const).map((l) => (
                <img key={l} src={`/assets/${l}.png`} alt={l} className="h-7 w-auto" style={{ imageRendering: 'pixelated' }} />
              ))}
            </div>
            <div className="absolute bottom-0 left-2 flex gap-1">
              <img src="/assets/CHUM_KP_L1.png" alt="" className="h-5" />
              <img src="/assets/CHUM_KP_L2.png" alt="" className="h-5" />
              <img src="/assets/CHUM_KP_L3.png" alt="" className="h-5" />
            </div>
          </div>
        </div>

        {/* HEADER RIGHT — Войти + socials */}
        <div className="absolute top-8 right-12 z-10 flex items-center gap-3">
          <Link
            to="/login"
            className="font-mono text-sm text-[#E6E6E6] bg-[#1a3550] border border-[#2a5070] hover:border-cyber-cyan hover:text-cyber-cyan px-5 py-2 rounded-sm transition-all duration-200"
          >
            Войти
          </Link>
          <div className="flex gap-2">
            <div className="w-10 h-10 border border-[#2a5070] rounded-sm bg-[#1a3550] flex items-center justify-center hover:border-cyber-cyan transition-colors cursor-pointer">
              <img src="/assets/Gplus.png" alt="G+" className="w-6 h-6 object-contain" />
            </div>
            <div className="w-10 h-10 border border-[#2a5070] rounded-sm bg-[#1a3550] flex items-center justify-center hover:border-cyber-cyan transition-colors cursor-pointer">
              <img src="/assets/Facebook.png" alt="FB" className="w-6 h-6 object-contain" />
            </div>
            <div className="w-10 h-10 border border-[#2a5070] rounded-sm bg-[#1a3550] flex items-center justify-center hover:border-cyber-cyan transition-colors cursor-pointer">
              <img src="/assets/vk.png" alt="VK" className="w-6 h-6 object-contain" />
            </div>
          </div>
        </div>

        {/* CHAT WINDOW — center left */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-end gap-8">
          {/* Chat bubble */}
          <div className="w-80">
            <img src="/assets/CHAT_WINDOW.png" alt="" className="w-full" />
            <div className="relative -mt-2">
              <img src="/assets/CHAT_FIRST_MSG.png" alt="" className="w-full -mt-1 animate-[fadeIn_0.5s_ease_0.3s_both]" />
              <img src="/assets/CHAT_SECOND_MSG.png" alt="" className="w-full -mt-1 animate-[fadeIn_0.5s_ease_0.8s_both]" />
              <img src="/assets/CHAT_THIRD_MSG.png" alt="" className="w-full -mt-1 animate-[fadeIn_0.5s_ease_1.3s_both]" />
              <img src="/assets/CHAT_FOURTH_MSG.png" alt="" className="w-full -mt-1 animate-[fadeIn_0.5s_ease_1.8s_both]" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <img src="/assets/CHAT_ENTER_WINDOW.png" alt="" className="flex-1 h-10 object-fill" />
              <Link
                to="/register"
                className="group relative"
              >
                <img
                  src="/assets/CHAT_BE_A_DICK_BUTTON.png"
                  alt="Стать членом"
                  className="h-10 hover:scale-105 transition-transform duration-200 cursor-pointer"
                />
              </Link>
            </div>
          </div>

          {/* Face */}
          <div
            ref={faceRef}
            className="w-44 h-44 bg-contain bg-no-repeat bg-center transition-all duration-500"
            style={{ backgroundImage: "url('/assets/CHUM_EBALO.png')" }}
          />
        </div>

        {/* SIGN TEXT */}
        <p className="absolute font-sans text-xl text-[#E6E6E6]" style={{ left: 380, top: 180 }}>
          Войти
        </p>

        {/* FOOTER TICKER */}
        <div className="absolute bottom-0 left-0 right-0 h-9 bg-[#0a1520] border-t border-[#1e3a5f] overflow-hidden flex items-center">
          <div className="animate-marquee whitespace-nowrap font-mono text-xs text-[#7a9bb5]">
            {TICKER_MESSAGES.map((msg, i) => (
              <span key={i} className="mr-12">
                <span className="text-[#FF384F] font-bold">{msg.split(' ')[0]}</span>
                {' '}
                {msg.split(' ').slice(1).join(' ')}
              </span>
            ))}
            {/* duplicate for seamless loop */}
            {TICKER_MESSAGES.map((msg, i) => (
              <span key={`dup-${i}`} className="mr-12">
                <span className="text-[#FF384F] font-bold">{msg.split(' ')[0]}</span>
                {' '}
                {msg.split(' ').slice(1).join(' ')}
              </span>
            ))}
          </div>
        </div>

        {/* FOOTER SOCIALS bottom-left */}
        <div className="absolute bottom-10 left-12 flex gap-4 z-10">
          {[
            { src: '/assets/FOOTER_F.png', alt: 'fb' },
            { src: '/assets/FOOTER_VK.png', alt: 'vk' },
            { src: '/assets/FOOTER_TW.png', alt: 'tw' },
            { src: '/assets/FOOTER_INST.png', alt: 'ig' },
          ].map((s) => (
            <a key={s.alt} href="#" className="opacity-60 hover:opacity-100 transition-opacity">
              <img src={s.src} alt={s.alt} className="w-5 h-5 object-contain" />
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
