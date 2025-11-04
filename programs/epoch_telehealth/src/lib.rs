use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

const COMP_DEF_OFFSET_SHARE_RECORD: u32 = comp_def_offset("share_medical_record");

declare_id!("C3BUuszcSAug8yp589QGV8xa7DpqLbPyRAm9qzJSMs3A");

#[arcium_program]
pub mod epoch_telehealth {
    use super::*;

    /// Stores encrypted medical record data on-chain.
    ///
    /// All data fields are provided as encrypted 32-byte arrays that can only be
    /// decrypted by authorized parties (patient and authorized healthcare providers).
    pub fn store_medical_record(
        ctx: Context<StoreMedicalRecord>,
        _record_id: [u8; 32],
        patient_id: [u8; 32],
        doctor_id: [u8; 32],
        consultation_date: [u8; 32],
        diagnosis: [u8; 32],
        symptoms: [u8; 32],
        treatment_plan: [u8; 32],
        medications: [u8; 32],
        notes: [u8; 32]
    ) -> Result<()> {
        let record = &mut ctx.accounts.medical_record;
        record.patient_id = patient_id;
        record.doctor_id = doctor_id;
        record.consultation_date = consultation_date;
        record.diagnosis = diagnosis;
        record.symptoms = symptoms;
        record.treatment_plan = treatment_plan;
        record.medications = medications;
        record.notes = notes;

        Ok(())
    }

    /// Initialize the computation definition for sharing medical records
    pub fn init_share_record_comp_def(
        ctx: Context<InitShareRecordCompDef>,
    ) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    /// Share medical record with authorized healthcare provider
    pub fn share_medical_record(
        ctx: Context<ShareMedicalRecord>,
        computation_offset: u64,
        receiver: [u8; 32],
        receiver_nonce: u128,
        sender_pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let args = vec![
            Argument::ArcisPubkey(receiver),
            Argument::PlaintextU128(receiver_nonce),
            Argument::ArcisPubkey(sender_pub_key),
            Argument::PlaintextU128(nonce),
            Argument::Account(
                ctx.accounts.medical_record.key(),
                8,
                MedicalRecord::INIT_SPACE as u32,
            ),
        ];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ShareMedicalRecordCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "share_medical_record")]
    pub fn share_medical_record_callback(
        ctx: Context<ShareMedicalRecordCallback>,
        output: ComputationOutputs<ShareMedicalRecordOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(ShareMedicalRecordOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(ReceivedMedicalRecordEvent {
            nonce: o.nonce.to_le_bytes(),
            patient_id: o.ciphertexts[0],
            doctor_id: o.ciphertexts[1],
            consultation_date: o.ciphertexts[2],
            diagnosis: o.ciphertexts[3],
            symptoms: o.ciphertexts[4],
            treatment_plan: o.ciphertexts[5],
            medications: o.ciphertexts[6],
            notes: o.ciphertexts[7],
        });
        Ok(())
    }
}

/// Stores the account that receives shared medical record data
#[derive(Accounts)]
#[instruction(record_id: u64)]
pub struct StoreMedicalRecord<'info> {
    #[account(mut)]
    pub doctor: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(
        init,
        payer = doctor,
        space = 8 + MedicalRecord::INIT_SPACE,
        seeds = [
            b"medical_record",
            doctor.key().as_ref(),
            &record_id.to_le_bytes()
        ],
        bump,
    )]
    pub medical_record: Account<'info, MedicalRecord>,
}

/// Account structure for medical record sharing
#[queue_computation_accounts("share_medical_record", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ShareMedicalRecord<'info> {
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
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SHARE_RECORD)
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
    pub medical_record: Account<'info, MedicalRecord>,
}

#[callback_accounts("share_medical_record")]
#[derive(Accounts)]
pub struct ShareMedicalRecordCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SHARE_RECORD)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("share_medical_record", payer)]
#[derive(Accounts)]
pub struct InitShareRecordCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct ReceivedMedicalRecordEvent {
    pub nonce: [u8; 16],
    pub patient_id: [u8; 32],
    pub doctor_id: [u8; 32],
    pub consultation_date: [u8; 32],
    pub diagnosis: [u8; 32],
    pub symptoms: [u8; 32],
    pub treatment_plan: [u8; 32],
    pub medications: [u8; 32],
    pub notes: [u8; 32],
}

/// The structure that holds encrypted medical record data
#[account]
#[derive(InitSpace)]
pub struct MedicalRecord {
    /// Encrypted patient identifier
    pub patient_id: [u8; 32],
    /// Encrypted doctor identifier
    pub doctor_id: [u8; 32],
    /// Encrypted date of consultation
    pub consultation_date: [u8; 32],
    /// Encrypted diagnosis information
    pub diagnosis: [u8; 32],
    /// Encrypted symptoms description
    pub symptoms: [u8; 32],
    /// Encrypted treatment plan
    pub treatment_plan: [u8; 32],
    /// Encrypted medications list
    pub medications: [u8; 32],
    /// Encrypted additional notes
    pub notes: [u8; 32],
}


#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Invalid medical record data format")]
    InvalidRecordData,
    #[msg("Cluster not set")]
    ClusterNotSet,
}