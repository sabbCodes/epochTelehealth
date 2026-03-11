const fs = require('fs');
const file = 'app/schedule/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// ==== 1. Fix standard pricing logic & platform fee inside the component body ====
const oldFeeLogic = `  // Calculate fees dynamically
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
  const totalAmount = consultationFee; // Platform fee typically deducted from doctor portion transparently`;

const newFeeLogic = `  // Calculate fees dynamically
  let consultationFee = 0;
  if (selectedType) {
    if (selectedType.id === "video") consultationFee = Number(doctor.consultation_fee_30min_video) || 0;
    else if (selectedType.id === "extended_video") consultationFee = Number(doctor.consultation_fee_60min_video) || 0;
    else if (selectedType.id === "text") consultationFee = Number(doctor.consultation_fee_30min_chat) || 0;
  } else {
    const fees = [doctor.consultation_fee_30min_video, doctor.consultation_fee_60min_video, doctor.consultation_fee_30min_chat].filter((f) => !!f);
    consultationFee = fees.length > 0 ? Math.min(...fees) : 0;
  }
  
  const platformFee = consultationFee * 0.25;
  const totalAmount = consultationFee; // Platform fee typically deducted from doctor portion transparently`;

content = content.replace(oldFeeLogic, newFeeLogic);

// ==== 2. Update ConsultationTypes Array ====
const oldTypes = `  // Consultation types with proper TypeScript types
  const consultationTypes: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    duration: number;
  }> = [
    {
      id: "video",
      name: "Video Call",
      description: "Face-to-face video consultation",
      icon: Video,
      duration: 30,
    },
    {
      id: "extended_video",
      name: "Extended Video Call",
      description: "Longer video consultation",
      icon: Video,
      duration: 45,
    },
    {
      id: "text",
      name: "Text Chat",
      description: "Secure messaging consultation",
      icon: MessageCircle,
      duration: 30,
    },
  ];`;

const newTypes = `  // Consultation types with proper TypeScript types
  const consultationTypes: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    duration: number;
    price: number;
  }> = [
    {
      id: "video",
      name: "Video Call",
      description: "Face-to-face video consultation",
      icon: Video,
      duration: 30,
      price: Number(doctor.consultation_fee_30min_video) || 0,
    },
    {
      id: "extended_video",
      name: "Extended Video Call",
      description: "Comprehensive 60-minute video session",
      icon: Video,
      duration: 60,
      price: Number(doctor.consultation_fee_60min_video) || 0,
    },
    {
      id: "text",
      name: "Text Chat",
      description: "Secure async messaging consultation",
      icon: MessageCircle,
      duration: 30,
      price: Number(doctor.consultation_fee_30min_chat) || 0,
    },
  ];`;

content = content.replace(oldTypes, newTypes);

// ==== 3. Overhaul Date/Time Generator Methods ====
const datesSplit1 = content.split("  // Generate dates for the next 7 days");
if (datesSplit1.length > 1) {
  const datesSplit2 = datesSplit1[1].split("  const handleBooking = async () => {");
  
  const optimizedDatesLogic = `  // Generate dates for the next 7 days based on availability
  const generateDates = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const fullDayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayName = days[date.getDay()];
      const fullDayName = fullDayNames[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const dateString = \`\${day} \${month}\`;
      
      const daySchedule = doctor?.availability_schedule?.[fullDayName];
      const isOpen = daySchedule ? daySchedule.isOpen : true; // default true if no schedule defined

      return {
        value: dateString,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayName,
        date: dateString,
        dateObj: new Date(date),
        fullDayName,
        isOpen
      };
    });
  };

  const dates = generateDates();

  // Generate time slots based on the selected date's schedule
  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    
    // Find the full day name from the selected date string
    const dateObj = dates.find(d => d.value === selectedDate);
    if (!dateObj || !dateObj.isOpen) return [];
    
    const daySchedule = doctor?.availability_schedule?.[dateObj.fullDayName];
    
    const slots = [];
    
    // Default 8-5 if no schedule
    let startHour = 8, startMin = 0;
    let endHour = 17, endMin = 0;
    
    if (daySchedule && daySchedule.start && daySchedule.end) {
       const startParts = daySchedule.start.split(":");
       startHour = parseInt(startParts[0]);
       startMin = parseInt(startParts[1]);
       
       const endParts = daySchedule.end.split(":");
       endHour = parseInt(endParts[0]);
       endMin = parseInt(endParts[1]);
    }

    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push({
        time: \`\${currentHour % 12 || 12}:\${currentMin === 0 ? "00" : "30"} \${currentHour >= 12 ? "PM" : "AM"}\`,
        value: \`\${currentHour.toString().padStart(2, "0")}:\${currentMin === 0 ? "00" : "30"}\`,
      });
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleBooking = async () => {`;
  
  content = datesSplit1[0] + optimizedDatesLogic + datesSplit2[1];
}

// ==== 4. Replace the UI mapping blocks inside the JSX return statement ====

// Replace the Doctor Info card inner content to add languages / education
const oldDoctorInfoSearch = `<p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-2xl">
                      {doctor.bio || "No biography available."}
                    </p>
                  </div>`;
const newDoctorInfoSearch = `<div className="space-y-4 max-w-2xl">
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        {doctor.bio || "No biography available."}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        {/* Education */}
                        <div>
                          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200">
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Education</span>
                          </div>
                          {doctor.education ? (
                            <ul className="space-y-1">
                              {(() => {
                                const edus = Array.isArray(doctor.education) ? doctor.education : [doctor.education];
                                const flattened = edus.flatMap(e => (typeof e === 'string' ? e.split(',') : [e])).map(e => String(e).trim()).filter(Boolean);
                                if (flattened.length === 0) return <li className="text-sm text-slate-500 italic">Not specified</li>;
                                return flattened.map((item, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="text-[#004DFF]">•</span>
                                    <span>{item}</span>
                                  </li>
                                ));
                              })()}
                            </ul>
                          ) : (
                            <span className="text-sm text-slate-500 italic">Not specified</span>
                          )}
                        </div>
                        
                        {/* Languages */}
                        <div>
                          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200">
                            <MessageCircle className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Languages</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{languages}</p>
                        </div>
                      </div>
                    </div>
                  </div>`;
content = content.replace(oldDoctorInfoSearch, newDoctorInfoSearch);

// Add the price property to the Consultation type cards renderer
const oldConsCardSearch = `<div className="mt-auto">
                          <span className="inline-flex px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {type.duration} mins
                          </span>`;
const newConsCardSearch = `<div className="mt-auto flex justify-between items-center w-full">
                          <span className="inline-flex px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {type.duration} mins
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            \${type.price} USDC
                          </span>`;
content = content.replace(oldConsCardSearch, newConsCardSearch);

// Dates iteration string replace to disable non-open days
const oldDatesIteration = `className={\`p-3 outline-none flex flex-col items-center justify-center border-2 rounded-2xl transition-all duration-300 \\$\\{
                            isSelected
                              ? "border-[#004DFF] bg-[#004DFF]/5 text-[#004DFF] shadow-[0_0_15px_rgba(0,77,255,0.1)]"
                              : "border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-slate-600"
                          }\\`}`;
const newDatesIteration = `disabled={!date.isOpen}
                          className={\`p-3 outline-none flex flex-col items-center justify-center border-2 rounded-2xl transition-all duration-300 \\$\\{
                            isSelected
                              ? "border-[#004DFF] bg-[#004DFF]/5 text-[#004DFF] shadow-[0_0_15px_rgba(0,77,255,0.1)]"
                              : date.isOpen
                              ? "border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-slate-600 cursor-pointer"
                              : "border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 opacity-50 cursor-not-allowed"
                          }\\`}`;
content = content.replace(oldDatesIteration.replace(/\\\$\\\{/g, "\\$\\{"), newDatesIteration.replace(/\\\$\\\{/g, "\\$\\{"));

// Update time slots null state
const oldTimeSlotsLength = `{timeSlots.map((slot) => {`;
const newTimeSlotsLength = `  {timeSlots.length === 0 ? (
                            <div className="col-span-full py-6 text-center text-slate-500 italic text-sm">No availability on this date</div>
                          ) : timeSlots.map((slot) => {`;
content = content.replace(oldTimeSlotsLength, newTimeSlotsLength);

// Update Platform fee string in the receipt
const oldPlatformStr = `<span className="text-slate-500 dark:text-slate-400">Platform Fee (10%)</span>`;
const newPlatformStr = `<div className="flex flex-col">
                      <span className="text-slate-500 dark:text-slate-400">Platform Fee (25%)</span>
                    </div>`;
// Replace the exact string
content = content.replace(oldPlatformStr, newPlatformStr);

// Add the explainer near secure escrow
const oldSecureStr = `Funds stay locked until consultation complete.
                  </p>
                </div>`;
const newSecureStr = `Funds stay locked until consultation complete.
                  </p>
                </div>
                <p className="text-center text-[11px] text-slate-400 mb-6 px-4">
                  * Platform fee covers network fees and onchain records keeping.
                </p>`;
content = content.replace(oldSecureStr, newSecureStr);

fs.writeFileSync(file, content);
console.log("Rewrite successful");
