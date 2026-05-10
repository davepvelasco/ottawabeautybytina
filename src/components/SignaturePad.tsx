import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Type, PenLine, Maximize2, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  className?: string;
  typedName?: string;
}

export function SignaturePad({ label, onSave, className, typedName }: SignaturePadProps) {
  const sigPad = useRef<SignatureCanvas>(null);
  const fullSigPad = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isTyped, setIsTyped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync expanded pad with normal pad if something was already drawn
  useEffect(() => {
    if (isExpanded && !isTyped && sigPad.current && fullSigPad.current) {
      if (!sigPad.current.isEmpty()) {
        fullSigPad.current.fromDataURL(sigPad.current.toDataURL());
      }
    }
  }, [isExpanded, isTyped]);

  const clear = () => {
    sigPad.current?.clear();
    fullSigPad.current?.clear();
    setIsEmpty(true);
    onSave('');
  };

  const handleEnd = (target: 'normal' | 'full') => {
    const pad = target === 'normal' ? sigPad.current : fullSigPad.current;
    if (pad) {
      const empty = pad.isEmpty();
      setIsEmpty(empty);
      if (!empty) {
        const dataUrl = pad.getTrimmedCanvas().toDataURL('image/png');
        onSave(dataUrl);
        // Sync back to normal pad if moving from full
        if (target === 'full' && sigPad.current) {
          sigPad.current.fromDataURL(dataUrl);
        }
      } else {
        onSave('');
      }
    }
  };

  const toggleMode = () => {
    const newMode = !isTyped;
    setIsTyped(newMode);
    if (newMode && typedName) {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'italic 64px "Playfair Display", serif';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        onSave(canvas.toDataURL('image/png'));
      }
    } else {
      clear();
    }
  };

  const saveExpanded = () => {
    if (fullSigPad.current && !fullSigPad.current.isEmpty()) {
      const dataUrl = fullSigPad.current.getTrimmedCanvas().toDataURL('image/png');
      onSave(dataUrl);
      if (sigPad.current) {
        sigPad.current.clear();
        sigPad.current.fromDataURL(dataUrl);
      }
      setIsEmpty(false);
    }
    setIsExpanded(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</label>
        <button 
          type="button"
          onClick={toggleMode}
          className={cn(
            "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all border",
            isTyped 
              ? "bg-white text-black border-white" 
              : "bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white"
          )}
        >
          {isTyped ? <PenLine className="w-3 h-3" /> : <Type className="w-3 h-3" />}
          {isTyped ? "Draw Signature" : "Type Signature"}
        </button>
      </div>

      <div className="relative group">
        <div className="border border-white/10 rounded-sm bg-white overflow-hidden touch-none p-1">
          {isTyped ? (
            <div className="w-full h-48 flex items-center justify-center bg-white">
              <span className="text-3xl md:text-4xl font-serif italic text-black tracking-widest text-center px-4">
                {typedName || "Enter Name Above"}
              </span>
            </div>
          ) : (
            <SignatureCanvas
              ref={sigPad}
              penColor="#000000"
              canvasProps={{
                className: "w-full h-48 cursor-crosshair"
              }}
              onEnd={() => handleEnd('normal')}
            />
          )}
        </div>
        
        {!isTyped && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-full bg-black/80 text-white/40 hover:text-white transition-colors shadow-lg border border-white/10"
              title="Expand signature pad"
              type="button"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={clear}
              className="p-2 rounded-full bg-black/80 text-white/40 hover:text-white transition-colors shadow-lg border border-white/10"
              title="Clear signature"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isTyped && isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-black/10 font-serif italic text-2xl tracking-widest pl-1 pt-1">
            Sign here
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      <div className="md:hidden">
        <button 
          type="button"
          onClick={toggleMode}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-[10px] uppercase font-bold transition-all border",
            isTyped 
              ? "bg-white text-black border-white" 
              : "bg-white/5 text-white/40 border-white/10"
          )}
        >
          {isTyped ? <PenLine className="w-3 h-3" /> : <Type className="w-3 h-3" />}
          {isTyped ? "Draw Signature" : "Type Signature"}
        </button>
      </div>

      {/* Expanded Signature Dialog */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black p-4 md:p-10 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Drawing Mode</span>
                <h2 className="font-serif text-2xl text-white italic">{label}</h2>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 bg-white rounded-sm overflow-hidden relative cursor-crosshair">
              <SignatureCanvas
                ref={fullSigPad}
                penColor="#000000"
                canvasProps={{
                  className: "w-full h-full"
                }}
                onEnd={() => setIsEmpty(false)}
              />
              {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-black/5 font-serif italic text-4xl md:text-6xl tracking-widest">
                  Draw Signature Here
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  fullSigPad.current?.clear();
                  setIsEmpty(true);
                }}
                className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Clear
              </button>
              <button
                onClick={saveExpanded}
                className="px-12 py-5 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Save Signature
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
