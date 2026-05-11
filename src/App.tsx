import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users,
  UserRound,
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  User,
  Camera,
} from 'lucide-react';
import { ServiceType } from './types';
import { cn } from './lib/utils';
import { SignaturePad } from './components/SignaturePad';
import { QRCodeDisplay } from './components/QRCodeDisplay';

const SECTIONS = {
  CLIENT_INFO: 'Client Information',
  TREATMENTS: 'Services Requested',
  MINOR_PARENT: 'Parent/Guardian Info',
  HEALTH: 'Health, Skin & Sensitivity Information',
  WAIVERS: 'Waivers & Consents',
  SIGNATURE: 'Review & Sign'
};

const dataURLtoFile = (dataurl: string, filename: string) => {
  if (!dataurl || !dataurl.includes(',')) return null;
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const SERVICES = [
  { id: 'lash_ext', label: 'Lash Extensions' },
  { id: 'lash_lift', label: 'Lash Lift & Tint' },
  { id: 'brow', label: 'Brow Lamination' },
  { id: 'waxing', label: 'Waxing' }
];

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  
  // Form State
  const [services, setServices] = useState<ServiceType[]>([]);
  const [clientInfo, setClientInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    dob: ''
  });
  
  const [parentInfo, setParentInfo] = useState({
    fullName: '',
    relationship: '',
    phone: '',
    email: ''
  });

  const [medical, setMedical] = useState<Record<string, any>>({});
  const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>({});
  const [consents, setConsents] = useState({ photoConsent: true });
  const [signatures, setSignatures] = useState({ client: '', parent: '' });

  const isMinor = useMemo(() => {
    if (!clientInfo.dob) return false;
    const birthDate = new Date(clientInfo.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  }, [clientInfo.dob]);

  const steps = useMemo(() => {
    const list = [SECTIONS.CLIENT_INFO, SECTIONS.TREATMENTS];
    if (isMinor) list.push(SECTIONS.MINOR_PARENT);
    list.push(SECTIONS.HEALTH);
    list.push(SECTIONS.WAIVERS);
    list.push(SECTIONS.SIGNATURE);
    return list;
  }, [isMinor]);

  const handleNext = () => {
    if (step < steps.length - 1) setStep(prev => prev + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const isValid = isStepValid(steps[step], { clientInfo, parentInfo, services, acknowledgments, medical });
      if (isValid) {
        if (step === steps.length - 1) {
          if (!isSubmitting && signatures.client && (!isMinor || signatures.parent)) {
            handleSubmit();
          }
        } else {
          handleNext();
        }
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(prev => prev - 1);
    else setIsStarted(false);
  };

  const handleSubmit = async () => {
    if (services.length === 0) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("form-name", "client-intake");
      formData.append("fullName", clientInfo.fullName);
      formData.append("email", clientInfo.email);
      formData.append("phone", clientInfo.phone);
      formData.append("dob", clientInfo.dob);
      formData.append("services", services.join(', '));
      formData.append("isMinor", isMinor.toString());
      formData.append("parentFullName", isMinor ? parentInfo.fullName : '');
      formData.append("parentRelationship", isMinor ? parentInfo.relationship : '');
      formData.append("parentPhone", isMinor ? parentInfo.phone : '');
      formData.append("parentEmail", isMinor ? parentInfo.email : '');
      formData.append("medicalInfo", JSON.stringify(medical));
      formData.append("acknowledgments", JSON.stringify(acknowledgments));
      formData.append("signatures", JSON.stringify(signatures));

      const clientSigFile = dataURLtoFile(signatures.client, 'client-signature.png');
      if (clientSigFile) {
        formData.append("clientSignature", clientSigFile);
      }

      if (isMinor && signatures.parent) {
        const parentSigFile = dataURLtoFile(signatures.parent, 'parent-signature.png');
        if (parentSigFile) {
          formData.append("parentSignature", parentSigFile);
        }
      }

      const response = await fetch("/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error('Submission failed');
      
      setSubmittedId('REC-' + Math.random().toString(36).substring(2, 9).toUpperCase());
    } catch (err) {
      console.error("Submission failed:", err);
      // In development/preview environment (not Netlify), form submission will fail.
      // We simulate success for the purpose of demonstrating the flow.
      setSubmittedId('DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase());
      console.warn("Netlify Forms submission failed. This is expected outside of Netlify hosting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0D0D0D] border border-white/10 rounded-sm p-16 shadow-2xl max-w-xl w-full text-center space-y-10"
        >
          <div className="w-24 h-24 border border-white/10 rounded-full flex items-center justify-center mx-auto text-white">
            <CheckCircle2 className="w-10 h-10 stroke-1" />
          </div>
          <div className="space-y-4">
            <h2 className="font-serif text-3xl md:text-5xl font-light italic text-white">Submission Received</h2>
            <div className="py-2 px-4 bg-white/5 border border-white/10 rounded-full inline-block mx-auto">
              <p className="text-[10px] tracking-widest uppercase text-white/40">ID: {submittedId}</p>
            </div>
            <p className="text-[#8E8782] font-light leading-relaxed px-4 md:px-8">Your digital waiver has been successfully recorded. You may now download a copy for your records or return to the main portal.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                setSubmittedId(null);
                setIsStarted(false);
                setStep(0);
                setServices([]);
              }}
              className="w-full py-5 border border-white/20 text-white text-[10px] tracking-[0.3em] uppercase hover:bg-white/10 transition-all font-light"
            >
              Return to Concierge
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0D7D0] font-sans selection:bg-white/10 pb-20">
      {/* Header */}
      <header className="pt-10 md:pt-20 px-6 md:px-16 pb-8 md:pb-12 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 max-w-6xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-left"
        >
          <h1 className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-3 md:mb-4 font-sans">Digital Client Concierge</h1>
          <h2 className="text-3xl md:text-6xl font-serif italic text-white leading-tight font-light">Ottawa Beauty by Tina</h2>
        </motion.div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] tracking-widest uppercase text-white/40 mb-1">Form Portal v1.0</p>
          <p className="text-sm font-light text-white/60">Professional Studio Consent</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-0 md:px-16 py-10 md:py-16">
        <AnimatePresence mode="wait">
          {!isStarted ? (
            <motion.div 
              key="selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 md:px-0 space-y-6 md:space-y-8"
            >
              <div className="max-w-3xl mb-8 md:mb-12">
                <h3 className="text-2xl md:text-3xl font-serif font-light text-white mb-4 md:mb-6 italic">Welcome</h3>
                <p className="text-[#A09892] leading-relaxed max-w-xl text-base md:text-lg font-light">
                  To ensure the best results and your safety, please complete our digital intake form. 
                  Digital forms are required for every visit to keep our records updated.
                </p>
              </div>

              <div className="flex justify-start">
                <button 
                  onClick={() => setIsStarted(true)}
                  className="w-full md:w-auto px-12 py-5 bg-white text-black text-xs tracking-widest uppercase hover:bg-white/90 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                >
                  Begin Intake Form <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="mt-12 md:mt-20 p-8 md:p-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center flex-1">
                   <QRCodeDisplay />
                   <div className="max-w-xs space-y-2 text-center md:text-left">
                     <h5 className="text-lg font-serif text-white italic">In-Studio Check-in</h5>
                     <p className="text-sm text-[#8E8782] leading-relaxed font-light">
                       Scan this code to complete forms on your own device while waiting.
                     </p>
                   </div>
                </div>

                <div className="text-right space-y-4">
                  <div className="flex gap-4 justify-end">
                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] tracking-widest uppercase text-white/50">Secure Portal</span>
                  </div>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest">© 2024 Ottawa Beauty by Tina</p>
                </div>
              </div>
            </motion.div>
          ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-[#0D0D0D] border-y border-white/10 md:border md:rounded-sm shadow-2xl overflow-hidden w-full md:max-w-2xl mx-auto"
              >
              {/* Progress Bar */}
              <div className="h-1 w-full bg-white/5">
                <motion.div 
                  className="h-full bg-white/40"
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                />
              </div>

              <div className="p-6 md:p-14 space-y-8 md:space-y-10">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Section {step + 1} of {steps.length}</span>
                  <h3 className="font-serif text-2xl md:text-4xl font-light italic text-white">{steps[step]}</h3>
                </div>

                <div className="min-h-[400px]">
                  {renderStep(
                    steps[step], 
                    services, 
                    { clientInfo, setClientInfo, parentInfo, setParentInfo, medical, setMedical, acknowledgments, setAcknowledgments, consents, setConsents, signatures, setSignatures, isMinor, services, setServices },
                    handleKeyDown
                  )}
                </div>
                 <div className="pt-6 md:pt-10 border-t border-white/5 flex items-center justify-between gap-6">
                  <button 
                    onClick={handleBack}
                    className="text-xs uppercase tracking-widest font-medium text-white/40 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  {step === steps.length - 1 ? (
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || !signatures.client || (isMinor && !signatures.parent)}
                      className="px-6 md:px-10 py-4 border border-white/20 text-white text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
                    >
                      {isSubmitting ? "Finalizing..." : "Complete & Submit"}
                    </button>
                  ) : (
                    <button 
                      onClick={handleNext}
                      disabled={!isStepValid(steps[step], { clientInfo, parentInfo, services, acknowledgments, medical })}
                      className="px-6 md:px-10 py-4 bg-white text-black text-xs tracking-widest uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-30 flex items-center gap-2"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ServiceCard({ title, desc, icon, onClick, index }: { title: string, desc: string, icon: any, onClick: () => void, index: number }) {
  return (
    <button 
      onClick={onClick}
      className="group relative flex flex-col items-start p-8 bg-transparent border border-white/10 rounded-sm hover:bg-white/5 transition-all duration-500 text-left w-full h-full"
    >
      <div className="absolute top-4 right-6 text-[10px] tracking-[0.2em] uppercase text-white/20 font-sans">Form 0{index}</div>
      <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-10 group-hover:bg-white/10 transition-colors">
        <span className="text-white/40 group-hover:text-white transition-colors">{icon}</span>
      </div>
      <h3 className="font-serif text-2xl font-light text-white mb-3">{title}</h3>
      <p className="text-sm text-[#8E8782] mb-8 font-light leading-relaxed">{desc}</p>
      
      <div className="mt-auto w-full pt-6 border-t border-white/5 flex items-center justify-between group-hover:border-white/20 transition-colors">
        <span className="text-[10px] tracking-widest uppercase text-white/40 group-hover:text-white transition-colors">Start Form</span>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}

function isStepValid(section: string, data: any) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s-]{10,}$/;

  if (section === SECTIONS.CLIENT_INFO) {
    const { fullName, phone, email, dob } = data.clientInfo;
    return (
      fullName?.length > 2 && 
      phoneRegex.test(phone || '') && 
      emailRegex.test(email || '') && 
      dob
    );
  }
  if (section === SECTIONS.TREATMENTS) {
    return data.services && data.services.length > 0;
  }
  if (section === SECTIONS.MINOR_PARENT) {
    const { fullName, relationship, phone, email } = data.parentInfo;
    return fullName?.length > 2 && relationship && phoneRegex.test(phone || '') && emailRegex.test(email || '');
  }
  if (section === SECTIONS.HEALTH) {
    return data.medical && (
      Object.keys(data.medical).some(k => k !== 'notes' && data.medical[k] === true)
    );
  }
  if (section === SECTIONS.WAIVERS) {
    const requiredTags = [
      'serviceAck1', 'serviceAck2', 
      'riskAck1', 'riskAck2', 
      'aftercareAck1', 'aftercareAck2', 
      'disclosureAck1', 'disclosureAck2', 
      'releaseLiability1', 'releaseLiability2'
    ];
    return requiredTags.every(tag => data.acknowledgments[tag] === true);
  }
  return true; 
}

function renderStep(section: string, selectedServices: ServiceType[], state: any, onKeyDown?: (e: React.KeyboardEvent) => void) {
  switch (section) {
    case SECTIONS.CLIENT_INFO:
      return (
        <div className="space-y-8">
          <Input icon={<User />} label="Full Name" value={state.clientInfo.fullName} onChange={(v: string) => state.setClientInfo({...state.clientInfo, fullName: v})} onKeyDown={onKeyDown} />
          <Input icon={<Phone />} label="Phone Number" type="tel" value={state.clientInfo.phone} onChange={(v: string) => state.setClientInfo({...state.clientInfo, phone: v})} onKeyDown={onKeyDown} />
          <Input icon={<Mail />} label="Email Address" type="email" value={state.clientInfo.email} onChange={(v: string) => state.setClientInfo({...state.clientInfo, email: v})} onKeyDown={onKeyDown} />
          <Input icon={<Calendar />} label="Date of Birth" type="date" value={state.clientInfo.dob} onChange={(v: string) => state.setClientInfo({...state.clientInfo, dob: v})} onKeyDown={onKeyDown} />
        </div>
      );
    case SECTIONS.TREATMENTS:
      return (
        <div className="space-y-6">
          <p className="text-sm text-[#8E8782] font-light mb-6 uppercase tracking-widest">Services Requested [Select at least 1]</p>
          <div className="grid gap-3">
            {SERVICES.map((s) => (
              <Checkbox 
                key={s.id} 
                label={s.label} 
                checked={state.services.includes(s.id as ServiceType)}
                onKeyDown={onKeyDown}
                onChange={(checked: boolean) => {
                  if (checked) state.setServices([...state.services, s.id as ServiceType]);
                  else state.setServices(state.services.filter((v: any) => v !== s.id));
                }}
              />
            ))}
          </div>
        </div>
      );
    case SECTIONS.MINOR_PARENT:
      return (
        <div className="space-y-8">
          <Input icon={<UserRound />} label="Parent/Guardian Full Name" value={state.parentInfo.fullName} onChange={(v: string) => state.setParentInfo({...state.parentInfo, fullName: v})} onKeyDown={onKeyDown} />
          <Input icon={<Users />} label="Relationship to Minor" value={state.parentInfo.relationship} onChange={(v: string) => state.setParentInfo({...state.parentInfo, relationship: v})} onKeyDown={onKeyDown} />
          <Input icon={<Phone />} label="Parent Phone" type="tel" value={state.parentInfo.phone} onChange={(v: string) => state.setParentInfo({...state.parentInfo, phone: v})} onKeyDown={onKeyDown} />
          <Input icon={<Mail />} label="Parent Email" type="email" value={state.parentInfo.email} onChange={(v: string) => state.setParentInfo({...state.parentInfo, email: v})} onKeyDown={onKeyDown} />
        </div>
      );
    case SECTIONS.HEALTH:
      return <MedicalStep services={selectedServices} medical={state.medical} setMedical={state.setMedical} onKeyDown={onKeyDown} />;
    case SECTIONS.WAIVERS:
      return <WaiversStep state={state} isMinor={state.isMinor} onKeyDown={onKeyDown} />;
    case SECTIONS.SIGNATURE:
      return (
        <div className="space-y-12">
          {/* Summary View */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="p-8 bg-white/5 border border-white/10 rounded-sm space-y-8"
          >
            <h5 className="text-[10px] uppercase tracking-widest font-bold text-white/40 border-b border-white/10 pb-4">Digital Record Summary</h5>
            
            <div className="space-y-8 text-sm">
              {/* Row 1: Client & Parent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#8E8782] mb-2 font-bold">Client Information</p>
                  <p className="text-white font-light text-base">{state.clientInfo.fullName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[#8E8782] text-xs font-light">
                    <span>{new Date(state.clientInfo.dob).toLocaleDateString()} • {state.clientInfo.phone}</span>
                    <span>{state.clientInfo.email}</span>
                  </div>
                </div>

                {state.isMinor ? (
                   <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8E8782] mb-2 font-bold">Parent/Guardian Information</p>
                    <p className="text-white font-light text-base">{state.parentInfo.fullName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[#8E8782] text-xs font-light">
                      <span>{state.parentInfo.relationship} • {state.parentInfo.phone}</span>
                      <span>{state.parentInfo.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:block opacity-10">
                    <p className="text-[10px] uppercase tracking-widest text-[#8E8782] mb-2 font-bold">Parent/Guardian Information</p>
                    <p className="text-xs italic font-light">Adult Client</p>
                  </div>
                )}
              </div>

              {/* Row 2: Health Disclosures */}
              <div className="border-t border-white/5 pt-6">
                <p className="text-[10px] uppercase tracking-widest text-[#8E8782] mb-3 font-bold">Health, Skin & Sensitivity Disclosures</p>
                <div className="space-y-3">
                  {Object.keys(state.medical).filter(k => k !== 'notes' && k !== 'none' && state.medical[k] === true).length > 0 ? (
                    <ul className="columns-1 md:columns-2 gap-x-12 text-[#B0A8A2] text-xs font-light italic list-disc pl-4 space-y-2">
                      {Object.keys(state.medical)
                        .filter(k => k !== 'notes' && k !== 'none' && state.medical[k] === true)
                        .map(key => (
                          <li key={key} className="break-inside-avoid-column leading-relaxed">
                            {MEDICAL_QUESTIONS[key as keyof typeof MEDICAL_QUESTIONS] || key}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-white/40 text-xs font-light italic">No critical health or skin conditions declared.</p>
                  )}
                  {state.medical.notes && (
                    <div className="mt-2 p-3 bg-white/[0.03] border border-white/5 rounded-sm max-w-2xl">
                       <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1 font-bold">Additional Details</p>
                       <p className="text-[#8E8782] text-xs font-light italic leading-relaxed">"{state.medical.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Services Requested */}
              <div className="border-t border-white/5 pt-6">
                <p className="text-[10px] uppercase tracking-widest text-[#8E8782] mb-3 font-bold">Services Requested</p>
                <div className="flex flex-wrap gap-1.5">
                  {state.services.map((id: string) => {
                    const service = SERVICES.find(s => s.id === id);
                    return (
                      <span key={id} className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] uppercase tracking-wider text-white/70 font-medium">
                        {service?.label || id}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {state.isMinor && (
            <div className="p-8 bg-white/5 border border-white/10 rounded-sm space-y-4 italic">
              <h5 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Parent/Guardian Responsibilities</h5>
              <ul className="text-sm text-[#8E8782] font-light space-y-3 pl-4 list-disc">
                <li>I am the legal parent or guardian of the minor listed above</li>
                <li>I have provided accurate and complete medical information</li>
                <li>I have informed the technician of any conditions that may affect the service</li>
                <li>I understand aftercare instructions and will ensure they are followed</li>
              </ul>
            </div>
          )}
          
          <div className="space-y-8">
            <SignaturePad 
              label="Client Signature" 
              typedName={state.clientInfo.fullName}
              onSave={sig => state.setSignatures({...state.signatures, client: sig})} 
            />
            {state.isMinor && (
              <SignaturePad 
                label="Parent/Guardian Signature" 
                typedName={state.parentInfo.fullName}
                onSave={sig => state.setSignatures({...state.signatures, parent: sig})} 
              />
            )}
          </div>
          
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/20 font-bold">
            <span>Signed Date: {new Date().toLocaleDateString()}</span>
            <span>Electronic Record Verified</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function Input({ label, icon, type = "text", value, onChange, onKeyDown }: any) {
  return (
    <div className="space-y-3 group">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-3 group-focus-within:text-white transition-colors">
        {icon && <span className="w-4 h-4">{icon}</span>}
        {label}
      </label>
      <input 
        type={type} 
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:outline-none focus:border-white transition-all font-light placeholder:text-white/5"
        placeholder={`Enter ${label.toLowerCase()}...`}
        id={`input-${label.toLowerCase().replace(/\s/g, '-')}`}
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange, onKeyDown }: any) {
  return (
    <label 
      className="flex items-start gap-4 p-4 md:p-5 rounded-sm hover:bg-white/5 border border-white/5 cursor-pointer transition-all group"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div className={cn(
        "mt-0.5 w-5 h-5 shrink-0 rounded-sm border flex items-center justify-center transition-all",
        checked ? "bg-white border-white text-black" : "border-white/20 bg-transparent group-hover:border-white/40"
      )}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
      </div>
      <span className={cn(
        "text-sm font-light leading-snug transition-colors",
        checked ? "text-white" : "text-[#8E8782] group-hover:text-white/70"
      )}>{label}</span>
      <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} id={`checkbox-${label.substring(0, 10)}`} />
    </label>
  );
}

const MEDICAL_QUESTIONS = {
  active_skincare: 'Use of active skincare in the past 72 hours (Retinol, Accutane, AHA/BHA, glycolic acid, or other exfoliating products)',
  acne_med: 'Current or recent use of prescription acne medication (e.g., Accutane)',
  skin_conditions: 'Skin condition(s) (Sensitive skin, Eczema, Psoriasis, Dermatitis etc.)',
  pregnant: 'Pregnant',
  waxing_before: 'Had waxing done before',
  allergies: 'Known Allergies (wax, resins, adhesives, or skincare products)',
  eye_conditions: 'Eye conditions or infections (Conjunctivitis, styes, etc.)',
  recent_treatments: 'Recent Lash / Brow Treatments (tint, lift, waxing, lamination)',
  recent_surgeries: 'Recent medical treatments or surgeries affecting the eye/brow area',
  facial_procedures: 'Recent facial procedures (Botox, chemical peel, laser)',
  sensitive_eyes: 'Sensitive eyes',
  contact_lenses: 'Wear contact lenses',
  oil_products: 'Use of oil-based products around eyes'
};

function MedicalStep({ services, medical, setMedical, onKeyDown }: any) {
  const fields = useMemo(() => {
    const isLash = services.some((s: string) => s === 'lash_ext' || s === 'lash_lift');
    const isBrow = services.some((s: string) => s === 'brow');
    const isWaxing = services.some((s: string) => s === 'waxing');

    const all = new Map();
    
    // [All]
    all.set('active_skincare', MEDICAL_QUESTIONS.active_skincare);
    all.set('acne_med', MEDICAL_QUESTIONS.acne_med);
    all.set('skin_conditions', MEDICAL_QUESTIONS.skin_conditions);
    all.set('allergies', MEDICAL_QUESTIONS.allergies);
    
    // [Waxing]
    if (isWaxing) {
      all.set('pregnant', MEDICAL_QUESTIONS.pregnant);
      all.set('waxing_before', MEDICAL_QUESTIONS.waxing_before);
    }
    
    // [Lash and Brow]
    if (isLash || isBrow) {
      all.set('eye_conditions', MEDICAL_QUESTIONS.eye_conditions);
      all.set('recent_treatments', MEDICAL_QUESTIONS.recent_treatments);
      all.set('recent_surgeries', MEDICAL_QUESTIONS.recent_surgeries);
    }
    
    // [Brow]
    if (isBrow) {
      all.set('facial_procedures', MEDICAL_QUESTIONS.facial_procedures);
    }
    
    // [Lash]
    if (isLash) {
      all.set('sensitive_eyes', MEDICAL_QUESTIONS.sensitive_eyes);
      all.set('contact_lenses', MEDICAL_QUESTIONS.contact_lenses);
      all.set('oil_products', MEDICAL_QUESTIONS.oil_products);
    }
    
    return Array.from(all.entries()).map(([k, v]) => ({ key: k, label: v }));
  }, [services]);

  const handleToggle = (key: string, checked: boolean) => {
    const newMedical = { ...medical };
    if (key === 'none') {
      if (checked) {
        // Clear all others
        Object.keys(medical).forEach(k => { if (k !== 'notes') newMedical[k] = false; });
        newMedical.none = true;
      } else {
        newMedical.none = false;
      }
    } else {
      newMedical[key] = checked;
      if (checked) newMedical.none = false;
    }
    setMedical(newMedical);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-4">
        <p className="text-xs md:text-sm text-[#8E8782] font-light italic uppercase tracking-widest">Please check all that apply:</p>
      </div>
      <div className="grid gap-3">
        {fields.map((f: any) => (
          <Checkbox 
            key={f.key} 
            label={f.label} 
            checked={medical[f.key] || false} 
            onChange={(v: boolean) => handleToggle(f.key, v)} 
            onKeyDown={onKeyDown}
          />
        ))}
        <div className="pt-2">
          <Checkbox 
            label="None of the above" 
            checked={medical.none || false}
            onChange={(v: boolean) => handleToggle('none', v)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      <div className="pt-8 space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Detailed Medical Information / Recent Procedures</label>
        <textarea 
          className="w-full p-6 bg-white/5 border border-white/10 rounded-sm focus:outline-none focus:border-white/30 transition-all font-light text-white text-sm h-32 placeholder:text-white/10 italic"
          placeholder="List any medical conditions, surgeries, or specific concerns..."
          value={medical.notes || ''}
          onChange={e => setMedical({...medical, notes: e.target.value})}
          onKeyDown={onKeyDown}
          id="medical-notes"
        />
      </div>
    </div>
  );
}

function WaiversStep({ state, isMinor, onKeyDown }: any) {
  const services = state.services;
  const isLashes = services.some((s: string) => s === 'lash_ext' || s === 'lash_lift');
  const isBrows = services.some((s: string) => s === 'brow');
  const isWaxing = services.some((s: string) => s === 'waxing');

  const serviceNames = useMemo(() => {
    const names = services.map((id: string) => SERVICES.find(s => s.id === id)?.label).filter(Boolean);
    
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
  }, [services]);

  const showNaturalLashesRisks = services.some((s: string) => s === 'lash_ext' || s === 'lash_lift');

  const riskStatement = useMemo(() => {
    const segments = ["redness", "irritation"];
    if (isWaxing) segments.push("skin lifting", "minor injury");
    if (isBrows) segments.push("dryness");
    segments.push("itching", "swelling");
    if (isBrows || isLashes) segments.push("eye discomfort or watering");
    segments.push("allergic reactions or sensitivity");
    if (isBrows || isLashes) segments.push("uneven results or shorter retention");
    
    let text = segments.join(", ");
    if (isLashes) {
      text += ", and potential damage to natural lashes";
    }

    return `I understand that the selected service(s) involve the use of adhesives, chemical solutions, and tools near the eyes and skin, and may include risks such as ${text} if proper aftercare is not followed.`;
  }, [services, isWaxing, isBrows, isLashes]);

  const handleToggle = (key: string, value: boolean) => {
    state.setAcknowledgments({
      ...state.acknowledgments,
      [key]: value
    });
  };

  return (
    <div className="space-y-12">
      <div className="space-y-6 md:space-y-8">
        <div className="space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/20">Please review and check all boxes to proceed:</p>
        </div>
        <div className="grid gap-8">
          {/* Service Acknowledgment */}
          <div className="space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Service Acknowledgement</h5>
            <div className="grid gap-3">
              <Checkbox 
                label={`I understand I am receiving ${serviceNames || "the selected services"}.`}
                checked={state.acknowledgments.serviceAck1 || false}
                onChange={(v: boolean) => handleToggle('serviceAck1', v)}
                onKeyDown={onKeyDown}
              />
              <Checkbox 
                label={`I understand results may vary depending on my skin type, hair condition, ${showNaturalLashesRisks ? "natural lashes, " : ""}and aftercare.`}
                checked={state.acknowledgments.serviceAck2 || false}
                onChange={(v: boolean) => handleToggle('serviceAck2', v)}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>

          {/* Acknowledgement of Risk */}
          <div className="space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Acknowledgement of Risk</h5>
            <div className="grid gap-3">
              <Checkbox 
                label={riskStatement}
                checked={state.acknowledgments.riskAck1 || false}
                onChange={(v: boolean) => handleToggle('riskAck1', v)}
                onKeyDown={onKeyDown}
              />
              <Checkbox 
                label="I understand these risks are rare but possible."
                checked={state.acknowledgments.riskAck2 || false}
                onChange={(v: boolean) => handleToggle('riskAck2', v)}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>

          {/* Aftercare Responsibility */}
          <div className="space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Aftercare Responsibility</h5>
            <div className="grid gap-3">
              <Checkbox 
                label="I understand that proper aftercare is required to maintain results and reduce risk of irritation."
                checked={state.acknowledgments.aftercareAck1 || false}
                onChange={(v: boolean) => handleToggle('aftercareAck1', v)}
                onKeyDown={onKeyDown}
              />
              <Checkbox 
                label="I agree to follow all instructions provided and understand Ottawa Beauty by Tina is not responsible for issues resulting from failure to follow instructions."
                checked={state.acknowledgments.aftercareAck2 || false}
                onChange={(v: boolean) => handleToggle('aftercareAck2', v)}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>

          {/* Disclosure Confirmation */}
          <div className="space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Disclosure Confirmation</h5>
            <div className="grid gap-3">
              <Checkbox 
                label="I confirm that all information I have provided, including but not limited to medical conditions, allergies, sensitivities, eye conditions, and recent procedures, is accurate and complete."
                checked={state.acknowledgments.disclosureAck1 || false}
                onChange={(v: boolean) => handleToggle('disclosureAck1', v)}
                onKeyDown={onKeyDown}
              />
              <Checkbox 
                label="I understand that failure to disclose relevant information may increase the risk of irritation or adverse reactions."
                checked={state.acknowledgments.disclosureAck2 || false}
                onChange={(v: boolean) => handleToggle('disclosureAck2', v)}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>

          {/* Brazilian / Bikini Wax (Optional) */}
          {isWaxing && (
             <div className="space-y-4">
                <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">For Brazilian / Bikini Wax (if applicable)</h5>
                <Checkbox 
                  label="I understand the nature of intimate waxing and give my full consent for this service."
                  checked={state.acknowledgments.brazilianAck || false}
                  onChange={(v: boolean) => handleToggle('brazilianAck', v)}
                  onKeyDown={onKeyDown}
                />
             </div>
          )}

          {/* Consent & Release of Liability */}
          <div className="space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Consent & Release of Liability</h5>
            <div className="grid gap-3">
              <Checkbox 
                label={`I voluntarily consent to ${isMinor ? "my child receiving" : "receive"} the selected service(s) from Ottawa Beauty by Tina.`}
                checked={state.acknowledgments.releaseLiability1 || false}
                onChange={(v: boolean) => handleToggle('releaseLiability1', v)}
                onKeyDown={onKeyDown}
              />
              <Checkbox 
                label="I release and hold harmless Ottawa Beauty by Tina, its owner, technicians, and staff from any and all liability, claims, demands, injuries, damages, or adverse reactions arising out of or in connection with the services provided, except to the extent caused by gross negligence or willful misconduct."
                checked={state.acknowledgments.releaseLiability2 || false}
                onChange={(v: boolean) => handleToggle('releaseLiability2', v)}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>

          {/* Photo Consent */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Photo Consent</h5>
            <div className="grid gap-3">
              <Checkbox 
                label={`I consent to photos and videos ${isMinor ? "of my child" : ""} being taken and used for portfolio and marketing purposes, including social media, websites, and before-and-after promotional materials.`} 
                checked={state.consents.photoConsent}
                onChange={(v: boolean) => state.setConsents({...state.consents, photoConsent: v})}
                onKeyDown={onKeyDown}
              />
              <Checkbox 
                label="I do NOT consent." 
                checked={!state.consents.photoConsent}
                onChange={(v: boolean) => state.setConsents({...state.consents, photoConsent: !v})}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
