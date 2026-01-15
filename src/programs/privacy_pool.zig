//! Shadow Privacy Pool Program (Anchor style)

const std = @import("std");
const anchor = @import("anchor");
const sol = anchor.sdk;
const shadow = @import("shadow_protocol");

const PublicKey = sol.PublicKey;
const AccountInfo = sol.account.Account.Info;

const Groth16Proof = shadow.verifier.Groth16Proof;
const TransactionInputs = shadow.verifier.TransactionInputs;

const PoolState = shadow.state.PoolState;
const MerkleTreeState = shadow.state.MerkleTreeState;
const NullifierState = shadow.state.NullifierState;

const jupiter = shadow.cpi;

/// Program ID (to be replaced with actual deployed address)
pub const PROGRAM_ID = PublicKey.comptimeFromBase58(
    "ShadowPoo111111111111111111111111111111111",
);

const PoolAccount = anchor.Account(PoolState, .{
    .discriminator = anchor.accountDiscriminator("PoolState"),
});

const PoolAccountInit = anchor.Account(PoolState, .{
    .discriminator = anchor.accountDiscriminator("PoolState"),
    .init = true,
    .payer = "authority",
    .space = PoolState.SIZE,
});

const MerkleTreeAccount = anchor.Account(MerkleTreeState, .{
    .discriminator = anchor.accountDiscriminator("MerkleTreeState"),
});

const MerkleTreeAccountInit = anchor.Account(MerkleTreeState, .{
    .discriminator = anchor.accountDiscriminator("MerkleTreeState"),
    .init = true,
    .payer = "authority",
    .space = @sizeOf(MerkleTreeState),
});

const NullifierAccount = anchor.Account(NullifierState, .{
    .discriminator = anchor.accountDiscriminator("NullifierState"),
});

const NullifierAccountInit = anchor.Account(NullifierState, .{
    .discriminator = anchor.accountDiscriminator("NullifierState"),
    .init = true,
    .payer = "authority",
    .space = @sizeOf(NullifierState),
});

/// Initialize instruction args.
pub const InitializeArgs = struct {
    denomination: u64,
    merkle_depth: u8,
};

/// Deposit instruction args.
pub const DepositArgs = struct {
    commitment: [32]u8,
};

/// Withdraw instruction args.
pub const WithdrawArgs = struct {
    proof: [256]u8,
    root: [32]u8,
    public_amount: [32]u8,
    ext_data_hash: [32]u8,
    input_nullifier: [2][32]u8,
    output_commitment: [2][32]u8,
};

/// Swap instruction args.
pub const SwapArgs = struct {
    id: u8,
    route_plan_len: u32,
    in_amount: u64,
    quoted_out_amount: u64,
    slippage_bps: u16,
    platform_fee_bps: u8,
    route_plan_bytes: []const u8,
};

const InitializeAccounts = struct {
    authority: anchor.Signer,
    pool: PoolAccountInit,
    merkle_tree: MerkleTreeAccountInit,
    nullifier_set: NullifierAccountInit,
    token_mint: anchor.Unchecked,
    system_program: anchor.Program(sol.system_program.ID),
};

const DepositAccounts = struct {
    depositor: anchor.Signer,
    pool: PoolAccount,
    merkle_tree: MerkleTreeAccount,
};

const WithdrawAccounts = struct {
    pool: PoolAccount,
    merkle_tree: MerkleTreeAccount,
    nullifier_set: NullifierAccount,
};

const PauseAccounts = struct {
    authority: anchor.Signer,
    pool: PoolAccount,
};

const UnpauseAccounts = struct {
    authority: anchor.Signer,
    pool: PoolAccount,
};

const SwapAccounts = struct {
    pool: PoolAccount,
    token_program: anchor.Unchecked,
    program_authority: anchor.Unchecked,
    user_transfer_authority: anchor.Signer,
    source_token_account: anchor.Unchecked,
    program_source_token_account: anchor.Unchecked,
    program_destination_token_account: anchor.Unchecked,
    destination_token_account: anchor.Unchecked,
    source_mint: anchor.Unchecked,
    destination_mint: anchor.Unchecked,
    platform_fee_account: anchor.Unchecked,
    token_2022_program: anchor.Unchecked,
    event_authority: anchor.Unchecked,
    jupiter_program: anchor.UncheckedProgram,
};

pub const Program = struct {
    pub const id = PROGRAM_ID;

    pub const instructions = struct {
        pub const initialize = anchor.Instruction(.{ .Accounts = InitializeAccounts, .Args = InitializeArgs });
        pub const deposit = anchor.Instruction(.{ .Accounts = DepositAccounts, .Args = DepositArgs });
        pub const withdraw = anchor.Instruction(.{ .Accounts = WithdrawAccounts, .Args = WithdrawArgs });
        pub const pause = anchor.Instruction(.{ .Accounts = PauseAccounts, .Args = void });
        pub const unpause = anchor.Instruction(.{ .Accounts = UnpauseAccounts, .Args = void });
        pub const swap = anchor.Instruction(.{ .Accounts = SwapAccounts, .Args = SwapArgs });
    };

    pub fn initialize(ctx: anchor.Context(InitializeAccounts), args: InitializeArgs) !void {
        if (args.denomination == 0) return error.InvalidInstructionData;
        if (args.merkle_depth == 0 or args.merkle_depth > 26) return error.InvalidInstructionData;

        const initial_root = shadow.state.ZERO_VALUES[args.merkle_depth];

        ctx.accounts.pool.data = PoolState.init(
            ctx.accounts.token_mint.id.*,
            ctx.accounts.authority.key().*,
            args.denomination,
            args.merkle_depth,
            initial_root,
            0,
        );

        ctx.accounts.merkle_tree.data = MerkleTreeState.init(
            ctx.accounts.pool.key().*,
            args.merkle_depth,
        );

        ctx.accounts.nullifier_set.data = NullifierState.init(
            ctx.accounts.pool.key().*,
            0,
        );

        sol.log.log("Shadow Pool initialized");
    }

    pub fn deposit(ctx: anchor.Context(DepositAccounts), args: DepositArgs) !void {
        if (ctx.accounts.pool.data.paused) return error.InvalidInstructionData;

        const zero = [_]u8{0} ** 32;
        if (std.mem.eql(u8, &args.commitment, &zero)) return error.InvalidInstructionData;

        _ = try ctx.accounts.merkle_tree.data.insert(args.commitment);

        ctx.accounts.pool.data.merkle_root = ctx.accounts.merkle_tree.data.root;
        ctx.accounts.pool.data.next_leaf_index = ctx.accounts.merkle_tree.data.next_index;

        sol.log.log("Deposit successful");
    }

    pub fn withdraw(ctx: anchor.Context(WithdrawAccounts), args: WithdrawArgs) !void {
        if (ctx.accounts.pool.data.paused) return error.InvalidInstructionData;

        if (!ctx.accounts.merkle_tree.data.isKnownRoot(args.root)) {
            return error.InvalidInstructionData;
        }

        for (args.input_nullifier) |nullifier| {
            if (ctx.accounts.nullifier_set.data.mightContain(nullifier)) {
                return error.InvalidInstructionData;
            }
        }

        const proof = Groth16Proof.fromBytes(&args.proof) catch {
            return error.InvalidInstructionData;
        };

        const inputs = TransactionInputs.new(
            args.root,
            args.public_amount,
            args.ext_data_hash,
            args.input_nullifier,
            args.output_commitment,
        );

        const vk_key = shadow.verifier.transaction2VerifyingKey() catch {
            return error.InvalidInstructionData;
        };
        const verifier = shadow.verifier.Groth16Verifier.init(vk_key);

        const is_valid = verifier.verify(&proof, &inputs) catch {
            return error.InvalidInstructionData;
        };
        if (!is_valid) return error.InvalidInstructionData;

        for (args.input_nullifier) |nullifier| {
            ctx.accounts.nullifier_set.data.add(nullifier);
        }

        sol.log.log("Withdrawal successful");
    }

    pub fn pause(ctx: anchor.Context(PauseAccounts)) !void {
        if (!ctx.accounts.pool.data.authority.equals(ctx.accounts.authority.key().*)) {
            return error.InvalidInstructionData;
        }
        ctx.accounts.pool.data.paused = true;
        sol.log.log("Pool paused");
    }

    pub fn unpause(ctx: anchor.Context(UnpauseAccounts)) !void {
        if (!ctx.accounts.pool.data.authority.equals(ctx.accounts.authority.key().*)) {
            return error.InvalidInstructionData;
        }
        ctx.accounts.pool.data.paused = false;
        sol.log.log("Pool unpaused");
    }

    pub fn swap(ctx: anchor.Context(SwapAccounts), args: SwapArgs) !void {
        if (ctx.accounts.pool.data.paused) return error.InvalidInstructionData;

        const required = 8 + 1 + 4 + args.route_plan_bytes.len + 8 + 8 + 2 + 1;
        if (required > 2048) return error.InvalidInstructionData;

        var buffer: [2048]u8 = undefined;
        const ix_len = try jupiter.buildSharedAccountsRouteDataInto(
            buffer[0..],
            .{
                .id = args.id,
                .route_plan_len = args.route_plan_len,
                .in_amount = args.in_amount,
                .quoted_out_amount = args.quoted_out_amount,
                .slippage_bps = args.slippage_bps,
                .platform_fee_bps = args.platform_fee_bps,
            },
            args.route_plan_bytes,
        );

        const cpi_accounts = jupiter.SharedAccountsRouteAccounts{
            .token_program = ctx.accounts.token_program,
            .program_authority = ctx.accounts.program_authority,
            .user_transfer_authority = ctx.accounts.user_transfer_authority.toAccountInfo(),
            .source_token_account = ctx.accounts.source_token_account,
            .program_source_token_account = ctx.accounts.program_source_token_account,
            .program_destination_token_account = ctx.accounts.program_destination_token_account,
            .destination_token_account = ctx.accounts.destination_token_account,
            .source_mint = ctx.accounts.source_mint,
            .destination_mint = ctx.accounts.destination_mint,
            .platform_fee_account = ctx.accounts.platform_fee_account,
            .token_2022_program = ctx.accounts.token_2022_program,
            .event_authority = ctx.accounts.event_authority,
            .program = ctx.accounts.jupiter_program.toAccountInfo(),
        };

        try jupiter.invokeSharedAccountsRoute(cpi_accounts, buffer[0..ix_len], &.{});

        sol.log.log("Swap successful");
    }
};

pub fn processInstruction(
    program_id: *const PublicKey,
    accounts: []const AccountInfo,
    data: []const u8,
) !void {
    try anchor.ProgramEntry(Program).dispatch(program_id, accounts, data);
}

comptime {
    sol.entrypoint(processInstruction);
}
