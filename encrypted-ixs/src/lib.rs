use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct MedicalRecord {
        pub patient_id: u64,
        pub doctor_id: u64,
        pub consultation_date: u64,
        pub diagnosis: u64,
        pub symptoms: u64,
        pub treatment_plan: u64,
        pub medications: u64,
        pub notes: u64,
    }

    #[instruction]
    pub fn share_medical_record(
        receiver: Shared,
        input_ctxt: Enc<Shared, MedicalRecord>,
    ) -> Enc<Shared, MedicalRecord> {
        let input = input_ctxt.to_arcis();
        receiver.from_arcis(input)
    }
}
