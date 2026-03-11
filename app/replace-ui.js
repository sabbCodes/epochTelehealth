const fs = require('fs');
const file = 'app/schedule/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { motion } from "framer-motion";', 'import { motion, AnimatePresence } from "framer-motion";');

const oldCalc = `  const consultationFee = doctor.consultation_fee || 0;
  const platformFee = consultationFee * 0.1;
  const totalAmount = consultationFee;
  const location = [doctor.city, doctor.country].filter(Boolean).join(", ");
  const experience = doctor.years_of_experience
    ? \`\\$\\{doctor.years_of_experience} years\`
    : "Experienced";
  const languages = doctor.languages?.join(", ") || "English";`;

const newCalc = `  // Calculate fees dynamically
  let consultationFee = 0;
  if (selectedType) {
    if (selectedType.id === "video") consultationFee = Number(doctor.consultation_fee_30min_video) || 0;
    else if (selectedType.id === "extended_video") consultationFee = Number(doctor.consultation_fee_60min_video) || 0;
    else if (selectedType.id === "text") consultationFee = Number(doctor.consultation_fee_30min_chat) || 0;
  } else {
    const fees = [doctor.consultation_fee_30min_video, doctor.consultation_fee_60min_video, doctor.consultation_fee_30min_chat].filter((f) => !!f);
    consultationFee = fees.length > 0 ? Math.min(...fees) : 0;
  }
  
  const platformFee = consultationFee * 0.1;
  const totalAmount = consultationFee; // Platform fee typically deducted from doctor portion transparently
  
  const location = [doctor.city, doctor.country].filter(Boolean).join(", ");
  const experience = doctor.years_of_experience
    ? \`\\$\\{doctor.years_of_experience} years\`
    : "Experienced";
  const languages = doctor.languages?.join(", ") || "English";`;

// First replace oldCalc directly if it exists, but the previous run probably failed before modifying it.
// Actually let's use a regex to be safe or just string split.
const [beforeCalc, afterCalc] = content.split("  const consultationFee = doctor.consultation_fee || 0;");
if (afterCalc) {
  const [_, afterFullCalc] = afterCalc.split('const languages = doctor.languages?.join(", ") || "English";');
  if (afterFullCalc) {
    content = beforeCalc + newCalc.replace(/\\\$/g, "$").replace(/\\{/g, "{") + afterFullCalc;
  }
}

const returnIndex = content.indexOf('  return (\n    <div className="min-h-screen bg-gray-50');
if (returnIndex !== -1) {
  const beforeReturn = content.slice(0, returnIndex);

  const newReturn = `  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-20 lg:pb-0">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#004DFF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors mb-4 cursor-pointer outline-none"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Schedule Appointment
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Book a secure, private consultation with your physician. Select the consultation type, date, and time below.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Doctor Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="relative shrink-0">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 shadow-lg border-4 border-white dark:border-slate-700">
                      <AvatarImage src={doctor.profile_image || "/placeholder.svg"} className="object-cover" />
                      <AvatarFallback className="text-2xl bg-slate-100 dark:bg-slate-800">
                        {\`\\$\\{formatName(doctor.first_name?.[0] || "")}\\$\\{formatName(doctor.last_name?.[0] || "")}\`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {doctor.is_verified && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#004DFF] rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                        {doctorName}
                      </h2>
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full">
                        Verified
                      </span>
                    </div>
                    <p className="text-[#004DFF] font-semibold text-base mb-4">
                      {doctor.specialization || "General Practitioner"}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300 mb-4">
                      {location && (
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
                          <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                          <span>{location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 shrink-0 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{doctor.rating || "5.0"}</span>
                        <span>({doctor.reviews_count || 0} reviews)</span>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-2xl">
                      {doctor.bio || "No biography available."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Consultation Type */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Select Consultation Type</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {consultationTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType?.id === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleConsultationTypeSelect(type)}
                        type="button"
                        className={\`p-4 rounded-2xl border-2 transition-all duration-300 text-left outline-none flex flex-col \\$\\{
                          isSelected 
                            ? "border-[#004DFF] bg-[#004DFF]/5 shadow-[0_0_20px_rgba(0,77,255,0.15)] ring-2 ring-[#004DFF]/20" 
                            : "border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-slate-600 hover:shadow-md"
                        }\`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \\$\\{
                            isSelected ? "bg-[#004DFF] text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          }\`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {isSelected && <CheckCircle className="w-5 h-5 text-[#004DFF]" />}
                        </div>
                        <h4 className={\`font-bold \\$\\{isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}\`}>{type.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2 line-clamp-2 leading-relaxed">{type.description}</p>
                        <div className="mt-auto">
                          <span className="inline-flex px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {type.duration} mins
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Date & Time */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Date & Time</h3>
                
                <div className="mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {dates.map((date) => {
                      const isSelected = selectedDate === date.value;
                      return (
                        <button
                          key={date.value}
                          type="button"
                          onClick={() => { setSelectedDate(date.value); setSelectedTime(""); }}
                          className={\`p-3 outline-none flex flex-col items-center justify-center border-2 rounded-2xl transition-all duration-300 \\$\\{
                            isSelected
                              ? "border-[#004DFF] bg-[#004DFF]/5 text-[#004DFF] shadow-[0_0_15px_rgba(0,77,255,0.1)]"
                              : "border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-slate-600"
                          }\`}
                        >
                          <span className={\`text-xs uppercase tracking-wider font-bold mb-1 \\$\\{
                            isSelected ? "text-[#004DFF]" : "text-slate-500 dark:text-slate-400"
                          }\`}>
                            {date.label}
                          </span>
                          <span className={\`font-extrabold \\$\\{isSelected ? "text-[#004DFF]" : "text-slate-900 dark:text-white"}\`}>
                            {date.date.split(' ')[0]}
                          </span>
                          <span className={\`text-xs font-medium \\$\\{isSelected ? "text-[#004DFF]/70" : "text-slate-500"}\`}>
                            {date.date.split(' ')[1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pt-2">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Available Slots</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                          {timeSlots.map((slot) => {
                            const isSelected = selectedTime === slot.time;
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                onClick={() => setSelectedTime(slot.time)}
                                className={\`py-2.5 px-3 outline-none text-sm font-semibold text-center rounded-xl border-2 transition-all \\$\\{
                                  isSelected
                                    ? "border-[#004DFF] bg-[#004DFF] text-white shadow-lg shadow-[#004DFF]/30"
                                    : "border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }\`}
                              >
                                {slot.time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Note */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <MessageCircle className="w-5 h-5 text-[#004DFF]" />
                  Add a Note <span className="text-slate-400 text-sm font-normal">(Optional)</span>
                </h3>
                <Textarea
                  placeholder="Describe your symptoms to help the doctor prepare..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[140px] resize-none outline-none focus:ring-2 focus:ring-[#004DFF]/20 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-base p-4 transition-all"
                />
              </div>
            </motion.div>

          </div>

          {/* Right Column (Summary) */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="sticky top-24">
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:border-slate-700/50 dark:shadow-none border border-slate-100 backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Calendar className="w-5 h-5 text-[#004DFF]" />
                  Booking Summary
                </h3>

                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-slate-500 dark:text-slate-400">Date</span>
                    <span className="font-bold text-right text-slate-900 dark:text-white">
                      {selectedDate ? \`\\$\\{dates.find((d) => d.value === selectedDate)?.label}, \\$\\{selectedDate}\` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-slate-500 dark:text-slate-400">Time</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedTime || "—"}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-slate-500 dark:text-slate-400">Type</span>
                    <span className="font-bold text-right text-slate-900 dark:text-white">
                      {selectedType ? \`\\$\\{selectedType.name} (\\$\\{selectedType.duration}m)\` : "—"}
                    </span>
                  </div>
                </div>

                <Separator className="my-6 dark:bg-slate-700/50 border-slate-100" />

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Consultation Fee</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{consultationFee.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Platform Fee (10%)</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{platformFee.toFixed(2)} USDC</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
                      <span className="text-2xl font-black text-[#004DFF]">{totalAmount.toFixed(2)} <span className="text-sm">USDC</span></span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Secure Escrow</span>
                  </div>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                    Funds stay locked until consultation complete.
                  </p>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || !selectedType || isProcessing}
                  className="w-full bg-[#004DFF] hover:bg-blue-700 text-white shadow-lg shadow-[#004DFF]/25 font-bold h-14 rounded-2xl text-base transition-all disabled:opacity-50 disabled:shadow-none outline-none"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                       <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Processing...
                    </div>
                  ) : (
                    "Confirm Appointment"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );`;

  content = beforeReturn + newReturn.replace(/\\\$/g, "$").replace(/\\{/g, "{") + '\n}\n';
}

fs.writeFileSync(file, content);
console.log("Rewrite successful");
