import { QRCodeSVG } from 'qrcode.react';
import { Share2, Smartphone } from 'lucide-react';

export function QRCodeDisplay() {
  const url = window.location.href;

  return (
    <div className="flex flex-col items-center space-y-6 p-10 bg-transparent border border-white/10 rounded-sm max-w-sm mx-auto group">
      <div className="bg-white p-4 rounded-sm shadow-[0_0_50px_rgba(255,255,255,0.05)] transition-all duration-500 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.15)]">
        <QRCodeSVG value={url} size={140} fgColor="#000000" bgColor="#ffffff" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-serif text-2xl font-light italic text-white flex items-center justify-center gap-3">
          <Smartphone className="w-5 h-5 text-white/40" />
          Mobile Intake
        </h3>
        <p className="text-sm text-[#8E8782] font-light leading-relaxed">
          Scan to complete your intake form privately on your mobile device.
        </p>
      </div>
      <button 
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: 'Ottawa Beauty by Tina - Client Forms',
              url: url
            });
          }
        }}
        className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 hover:text-white transition-all py-2 px-4 rounded-full border border-white/5 hover:border-white/20"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share Portal Link
      </button>
    </div>
  );
}
