use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

const COMP_DEF_OFFSET_SHARE_HEALTH_RECORD: u32 = comp_def_offset("share_health_record");

declare_id!("C3BUuszcSAug8yp589QGV8xa7DpqLbPyRAm9qzJSMs3A");

#[arcium_program]
pub mod epoch_telehealth {
    use super::*;

    pub fn init_share_health_record_comp_def(
        ctx: Context<InitShareHealthRecordCompDef>,
    ) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    /// Stores encrypted health record on-chain
    pub fn store_health_record(
        ctx: Context<StoreHealthRecord>,
        record_id: u64,
        patient_id: [u8; 32],
        doctor_id: [u8; 32],
        consultation_date: [u8; 32],
        diagnosis: [u8; 32],
        symptoms: [[u8; 32]; 5],
        treatment_plan: [u8; 32],
        medications: [[u8; 32]; 5],
        notes: [u8; 32],
    ) -> Result<()> {
        let health_record = &mut ctx.accounts.health_record;

        health_record.patient_id = patient_id;
        health_record.doctor_id = doctor_id;
        health_record.consultation_date = consultation_date;
        health_record.diagnosis = diagnosis;
        health_record.symptoms = symptoms;
        health_record.treatment_plan = treatment_plan;
        health_record.medications = medications;
        health_record.notes = notes;
        health_record.created_at = Clock::get()?.unix_timestamp;

        emit!(HealthRecordStoredEvent {
            record_id,
            created_at: health_record.created_at,
        });

        Ok(())
    }

    /// Shares health record confidentially
    pub fn share_health_record(
        ctx: Context<ShareHealthRecord>,
        computation_offset: u64,
        receiver: [u8; 32],
        receiver_nonce: u128,
        sender_pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let hr = &ctx.accounts.health_record;

        let mut args = vec![
            Argument::ArcisPubkey(receiver),
            Argument::PlaintextU128(receiver_nonce),
            Argument::ArcisPubkey(sender_pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU128(hr.patient_id),
            Argument::EncryptedU128(hr.doctor_id),
            Argument::EncryptedU64(hr.consultation_date),
            Argument::EncryptedU64(hr.diagnosis),
        ];

        // Add all 5 symptoms
        for symptom in &hr.symptoms {
            args.push(Argument::EncryptedU64(*symptom));
        }

        args.push(Argument::EncryptedU64(hr.treatment_plan));

        // Add all 5 medications
        for medication in &hr.medications {
            args.push(Argument::EncryptedU64(*medication));
        }

        args.push(Argument::EncryptedU64(hr.notes));

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ShareHealthRecordCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "share_health_record")]
    pub fn share_health_record_callback(
        ctx: Context<ShareHealthRecordCallback>,
        output: ComputationOutputs<ShareHealthRecordOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(ShareHealthRecordOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        // Extract 16 ciphertexts matching circuit output
        let patient_id = o.ciphertexts[0];
        let doctor_id = o.ciphertexts[1];
        let consultation_date = o.ciphertexts[2];
        let diagnosis = o.ciphertexts[3];

        let mut symptoms = [[0u8; 32]; 5];
        for i in 0..5 {
            symptoms[i] = o.ciphertexts[4 + i];
        }

        let treatment_plan = o.ciphertexts[9];

        let mut medications = [[0u8; 32]; 5];
        for i in 0..5 {
            medications[i] = o.ciphertexts[10 + i];
        }

        let notes = o.ciphertexts[15];

        emit!(ReceivedHealthRecordEvent {
            nonce: o.nonce.to_le_bytes(),
            patient_id,
            doctor_id,
            consultation_date,
            diagnosis,
            symptoms,
            treatment_plan,
            medications,
            notes,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(record_id: u64)]
pub struct StoreHealthRecord<'info> {
    #[account(mut)]
    pub doctor: Signer<'info>,
    pub system_program: Program<'info, System>,

    #[account(
        init,
        payer = doctor,
        space = 8 + HealthRecord::INIT_SPACE,
        seeds = [
            b"health_record",
            doctor.key().as_ref(),
            &record_id.to_le_bytes()
        ],
        bump,
    )]
    pub health_record: Account<'info, HealthRecord>,
}

#[queue_computation_accounts("share_health_record", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ShareHealthRecord<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SHARE_HEALTH_RECORD)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS,
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
    pub health_record: Account<'info, HealthRecord>,
}

#[callback_accounts("share_health_record")]
#[derive(Accounts)]
pub struct ShareHealthRecordCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SHARE_HEALTH_RECORD)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("share_health_record", payer)]
#[derive(Accounts)]
pub struct InitShareHealthRecordCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct HealthRecordStoredEvent {
    pub record_id: u64,
    pub created_at: i64,
}

#[event]
pub struct ReceivedHealthRecordEvent {
    pub nonce: [u8; 16],
    pub patient_id: [u8; 32],
    pub doctor_id: [u8; 32],
    pub consultation_date: [u8; 32],
    pub diagnosis: [u8; 32],
    pub symptoms: [[u8; 32]; 5],
    pub treatment_plan: [u8; 32],
    pub medications: [[u8; 32]; 5],
    pub notes: [u8; 32],
}

#[account]
#[derive(InitSpace)]
pub struct HealthRecord {
    pub patient_id: [u8; 32],
    pub doctor_id: [u8; 32],
    pub consultation_date: [u8; 32],
    pub diagnosis: [u8; 32],
    pub symptoms: [[u8; 32]; 5],
    pub treatment_plan: [u8; 32],
    pub medications: [[u8; 32]; 5],
    pub notes: [u8; 32],
    pub created_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Invalid health record data")]
    InvalidHealthRecordData,
    #[msg("Cluster not set")]
    ClusterNotSet,
}