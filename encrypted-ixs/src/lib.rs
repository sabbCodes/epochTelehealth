use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct HealthRecord {
        pub patient_id: u128,
        pub doctor_id: u128,
        pub consultation_date: u64,
        pub diagnosis: u64,
        pub symptoms: [u64; 5],
        pub treatment_plan: u64,
        pub medications: [u64; 5],
        pub notes: u64,
    }

    #[instruction]
    pub fn share_health_record(
        receiver: Shared,
        input_ctxt: Enc<Shared, HealthRecord>,
    ) -> Enc<Shared, HealthRecord> {
        let input = input_ctxt.to_arcis();
        receiver.from_arcis(input)
    }
}