//! Shadow Privacy Pool Program (Anchor style)

const std = @import("std");
const anchor = @import("anchor");
const sol = anchor.sdk;
const shadow = @import("shadow_protocol");

const PublicKey = sol.PublicKey;
const AccountInfo = sol.account.Account.Info;
const token_state = sol.spl.token.state;

const Groth16Proof = shadow.verifier.Groth16Proof;
const TransactionInputs = shadow.verifier.TransactionInputs;

const PoolState = shadow.state.PoolState;
const MerkleTreeState = shadow.state.MerkleTreeState;
const NullifierState = shadow.state.NullifierState;
const PoolVault = shadow.state.PoolVault;

const jupiter = shadow.cpi;

const TOKEN_2022_PROGRAM_ID = PublicKey.comptimeFromBase58(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);

pub const PrivacyPoolError = error{
    InvalidDenomination,
    InvalidMerkleDepth,
    PoolPdaMismatch,
    PoolPaused,
    InvalidCommitment,
    InvalidRoot,
    NullifierAlreadyUsed,
    InvalidProof,
    Unauthorized,
    InvalidSwapAuthorityId,
    InvalidJupiterProgram,
    InvalidJupiterAuthority,
    InvalidJupiterEventAuthority,
    InvalidUserTransferAuthority,
    InvalidToken2022Program,
    InvalidVaultAccount,
    InvalidPlatformFeeAccount,
    InvalidSwapDataLength,
};

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

const MintAccount = anchor.Mint(.{
    .token_program = "token_program",
});

const SourceTokenAccount = anchor.TokenAccount(.{
    .mut = true,
    .mint = "source_mint",
    .authority = "user_transfer_authority",
    .token_program = "token_program",
});

const ProgramSourceTokenAccount = anchor.TokenAccount(.{
    .mut = true,
    .mint = "source_mint",
    .authority = "program_authority",
    .token_program = "token_program",
});

const ProgramDestinationTokenAccount = anchor.TokenAccount(.{
    .mut = true,
    .mint = "destination_mint",
    .authority = "program_authority",
    .token_program = "token_program",
});

const DestinationTokenAccount = anchor.TokenAccount(.{
    .mut = true,
    .mint = "destination_mint",
    .token_program = "token_program",
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
    token_program: anchor.Program(sol.spl.token.ID),
    program_authority: anchor.Unchecked,
    user_transfer_authority: anchor.Signer,
    source_token_account: SourceTokenAccount,
    program_source_token_account: ProgramSourceTokenAccount,
    program_destination_token_account: ProgramDestinationTokenAccount,
    destination_token_account: DestinationTokenAccount,
    source_mint: MintAccount,
    destination_mint: MintAccount,
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
        if (args.denomination == 0) return PrivacyPoolError.InvalidDenomination;
        if (args.merkle_depth == 0 or args.merkle_depth > 26) return PrivacyPoolError.InvalidMerkleDepth;

        const pool_pda = PublicKey.findProgramAddress(
            .{
                PoolState.SEEDS_PREFIX,
                ctx.accounts.token_mint.id.*.bytes[0..],
            },
            PROGRAM_ID,
        ) catch return PrivacyPoolError.PoolPdaMismatch;
        if (!pool_pda.address.equals(ctx.accounts.pool.key().*)) {
            return PrivacyPoolError.PoolPdaMismatch;
        }

        const initial_root = shadow.state.ZERO_VALUES[args.merkle_depth];

        ctx.accounts.pool.data = PoolState.init(
            ctx.accounts.token_mint.id.*,
            ctx.accounts.authority.key().*,
            args.denomination,
            args.merkle_depth,
            initial_root,
            pool_pda.bump_seed[0],
        );

        ctx.accounts.merkle_tree.data = MerkleTreeState.init(
            ctx.accounts.pool.key().*,
            args.merkle_depth,
        );

        ctx.accounts.nullifier_set.data = NullifierState.init(
            ctx.accounts.pool.key().*,
            0,
        );

        ctx.emit(InitializeEvent, .{
            .pool = ctx.accounts.pool.key().*,
            .token_mint = ctx.accounts.token_mint.id.*,
            .denomination = args.denomination,
            .merkle_depth = args.merkle_depth,
        });
        sol.log.log("Shadow Pool initialized");
    }

    pub fn deposit(ctx: anchor.Context(DepositAccounts), args: DepositArgs) !void {
        try validatePoolPda(&ctx.accounts.pool);
        if (ctx.accounts.pool.data.paused) return PrivacyPoolError.PoolPaused;

        const zero = [_]u8{0} ** 32;
        if (std.mem.eql(u8, &args.commitment, &zero)) return PrivacyPoolError.InvalidCommitment;

        _ = try ctx.accounts.merkle_tree.data.insert(args.commitment);

        ctx.accounts.pool.data.merkle_root = ctx.accounts.merkle_tree.data.root;
        ctx.accounts.pool.data.next_leaf_index = ctx.accounts.merkle_tree.data.next_index;

        ctx.emit(DepositEvent, .{
            .pool = ctx.accounts.pool.key().*,
            .commitment = args.commitment,
            .leaf_index = ctx.accounts.merkle_tree.data.next_index - 1,
        });
        sol.log.log("Deposit successful");
    }

    pub fn withdraw(ctx: anchor.Context(WithdrawAccounts), args: WithdrawArgs) !void {
        try validatePoolPda(&ctx.accounts.pool);
        if (ctx.accounts.pool.data.paused) return PrivacyPoolError.PoolPaused;

        if (!ctx.accounts.merkle_tree.data.isKnownRoot(args.root)) {
            return PrivacyPoolError.InvalidRoot;
        }

        for (args.input_nullifier) |nullifier| {
            if (ctx.accounts.nullifier_set.data.mightContain(nullifier)) {
                return PrivacyPoolError.NullifierAlreadyUsed;
            }
        }

        const proof = Groth16Proof.fromBytes(&args.proof) catch {
            return PrivacyPoolError.InvalidProof;
        };

        const inputs = TransactionInputs.new(
            args.root,
            args.public_amount,
            args.ext_data_hash,
            args.input_nullifier,
            args.output_commitment,
        );

        const vk_key = shadow.verifier.transaction2VerifyingKey() catch {
            return PrivacyPoolError.InvalidProof;
        };
        const verifier = shadow.verifier.Groth16Verifier.init(vk_key);

        const is_valid = verifier.verify(&proof, &inputs) catch {
            return PrivacyPoolError.InvalidProof;
        };
        if (!is_valid) return PrivacyPoolError.InvalidProof;

        for (args.input_nullifier) |nullifier| {
            ctx.accounts.nullifier_set.data.add(nullifier);
        }

        ctx.emit(WithdrawEvent, .{
            .pool = ctx.accounts.pool.key().*,
            .input_nullifier = args.input_nullifier,
            .output_commitment = args.output_commitment,
        });
        sol.log.log("Withdrawal successful");
    }

    pub fn pause(ctx: anchor.Context(PauseAccounts)) !void {
        try validatePoolPda(&ctx.accounts.pool);
        if (!ctx.accounts.pool.data.authority.equals(ctx.accounts.authority.key().*)) {
            return PrivacyPoolError.Unauthorized;
        }
        ctx.accounts.pool.data.paused = true;
        ctx.emit(PauseEvent, .{
            .pool = ctx.accounts.pool.key().*,
            .paused = true,
        });
        sol.log.log("Pool paused");
    }

    pub fn unpause(ctx: anchor.Context(UnpauseAccounts)) !void {
        try validatePoolPda(&ctx.accounts.pool);
        if (!ctx.accounts.pool.data.authority.equals(ctx.accounts.authority.key().*)) {
            return PrivacyPoolError.Unauthorized;
        }
        ctx.accounts.pool.data.paused = false;
        ctx.emit(PauseEvent, .{
            .pool = ctx.accounts.pool.key().*,
            .paused = false,
        });
        sol.log.log("Pool unpaused");
    }

    pub fn swap(ctx: anchor.Context(SwapAccounts), args: SwapArgs) !void {
        try validatePoolPda(&ctx.accounts.pool);
        if (ctx.accounts.pool.data.paused) return PrivacyPoolError.PoolPaused;

        try validateSwapAuthorityId(args.id);

        const jupiter_program_info = ctx.accounts.jupiter_program.toAccountInfo();
        if (!jupiter_program_info.id.*.equals(jupiter.PROGRAM_ID)) {
            return PrivacyPoolError.InvalidJupiterProgram;
        }

        const jupiter_authority_seeds = [_][]const u8{ "authority", &[_]u8{args.id} };
        const jupiter_authority = PublicKey.findProgramAddress(
            jupiter_authority_seeds,
            jupiter.PROGRAM_ID,
        );
        if (!ctx.accounts.program_authority.id.*.equals(jupiter_authority.address)) {
            return PrivacyPoolError.InvalidJupiterAuthority;
        }

        const jupiter_event_authority_seeds = [_][]const u8{ "__event_authority" };
        const jupiter_event_authority = PublicKey.findProgramAddress(
            jupiter_event_authority_seeds,
            jupiter.PROGRAM_ID,
        );
        if (!ctx.accounts.event_authority.id.*.equals(jupiter_event_authority.address)) {
            return PrivacyPoolError.InvalidJupiterEventAuthority;
        }

        try validateToken2022Program(ctx.accounts.token_2022_program);

        const pool_mint = ctx.accounts.pool.data.token_mint;
        const source_mint = ctx.accounts.source_mint.key().*;
        const destination_mint = ctx.accounts.destination_mint.key().*;
        try validateSwapVaults(
            ctx.accounts.pool.key().*,
            pool_mint,
            source_mint,
            destination_mint,
            ctx.accounts.source_token_account.key().*,
            ctx.accounts.destination_token_account.key().*,
        );
        try validatePlatformFeeAccount(
            ctx.accounts.platform_fee_account,
            destination_mint,
            ctx.accounts.token_program.toAccountInfo().id.*,
            args.platform_fee_bps,
        );

        try validateUserTransferAuthority(
            ctx.accounts.pool.data.token_mint,
            ctx.accounts.pool.data.bump,
            ctx.accounts.user_transfer_authority.key().*,
        );

        const required = 8 + 1 + 4 + args.route_plan_bytes.len + 8 + 8 + 2 + 1;
        if (required > 2048) return PrivacyPoolError.InvalidSwapDataLength;

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
            .token_program = ctx.accounts.token_program.toAccountInfo(),
            .program_authority = ctx.accounts.program_authority,
            .user_transfer_authority = ctx.accounts.user_transfer_authority.toAccountInfo(),
            .source_token_account = ctx.accounts.source_token_account.toAccountInfo(),
            .program_source_token_account = ctx.accounts.program_source_token_account.toAccountInfo(),
            .program_destination_token_account = ctx.accounts.program_destination_token_account.toAccountInfo(),
            .destination_token_account = ctx.accounts.destination_token_account.toAccountInfo(),
            .source_mint = ctx.accounts.source_mint.toAccountInfo(),
            .destination_mint = ctx.accounts.destination_mint.toAccountInfo(),
            .platform_fee_account = ctx.accounts.platform_fee_account,
            .token_2022_program = ctx.accounts.token_2022_program,
            .event_authority = ctx.accounts.event_authority,
            .program = ctx.accounts.jupiter_program.toAccountInfo(),
        };

        const signer_seeds = [_][]const u8{
            PoolState.SEEDS_PREFIX,
            ctx.accounts.pool.data.token_mint.bytes[0..],
            &[_]u8{ctx.accounts.pool.data.bump},
        };
        try jupiter.invokeSharedAccountsRoute(cpi_accounts, buffer[0..ix_len], signer_seeds[0..]);

        ctx.emit(SwapEvent, .{
            .pool = ctx.accounts.pool.key().*,
            .source_mint = source_mint,
            .destination_mint = destination_mint,
            .in_amount = args.in_amount,
            .quoted_out_amount = args.quoted_out_amount,
        });
        sol.log.log("Swap successful");
    }
};

fn validatePoolPda(pool: *const PoolAccount) !void {
    const expected = PublicKey.createProgramAddress(
        .{
            PoolState.SEEDS_PREFIX,
            pool.data.token_mint.bytes[0..],
            &[_]u8{pool.data.bump},
        },
        PROGRAM_ID,
    ) catch return PrivacyPoolError.PoolPdaMismatch;
    if (!expected.equals(pool.key().*)) return PrivacyPoolError.PoolPdaMismatch;
}

fn validateToken2022Program(info: *const AccountInfo) !void {
    const key = info.id.*;
    if (key.equals(sol.spl.token.ID)) return;
    if (key.equals(TOKEN_2022_PROGRAM_ID)) return;
    return PrivacyPoolError.InvalidToken2022Program;
}

fn validateSwapAuthorityId(id: u8) !void {
    if (id >= 8) return PrivacyPoolError.InvalidSwapAuthorityId;
}

fn validateUserTransferAuthority(pool_mint: PublicKey, bump: u8, authority: PublicKey) !void {
    const expected = PublicKey.createProgramAddress(
        .{
            PoolState.SEEDS_PREFIX,
            pool_mint.bytes[0..],
            &[_]u8{bump},
        },
        PROGRAM_ID,
    ) catch return PrivacyPoolError.InvalidUserTransferAuthority;
    if (!expected.equals(authority)) return PrivacyPoolError.InvalidUserTransferAuthority;
}

fn validateSwapVaults(
    pool_key: PublicKey,
    pool_mint: PublicKey,
    source_mint: PublicKey,
    destination_mint: PublicKey,
    source_token_account: PublicKey,
    destination_token_account: PublicKey,
) !void {
    const vault_pda = PoolVault.derivePda(pool_key, PROGRAM_ID);
    if (source_mint.equals(pool_mint)) {
        if (!source_token_account.equals(vault_pda.address)) {
            return PrivacyPoolError.InvalidVaultAccount;
        }
    }
    if (destination_mint.equals(pool_mint)) {
        if (!destination_token_account.equals(vault_pda.address)) {
            return PrivacyPoolError.InvalidVaultAccount;
        }
    }
}

fn validatePlatformFeeAccount(
    info: *const AccountInfo,
    destination_mint: PublicKey,
    token_program: PublicKey,
    platform_fee_bps: u8,
) !void {
    if (platform_fee_bps == 0) return;
    if (info.is_writable == 0) return PrivacyPoolError.InvalidPlatformFeeAccount;
    if (!info.owner_id.*.equals(token_program)) return PrivacyPoolError.InvalidPlatformFeeAccount;
    const account = token_state.Account.unpackUnchecked(info.data[0..info.data_len]) catch {
        return PrivacyPoolError.InvalidPlatformFeeAccount;
    };
    if (!account.mint.equals(destination_mint)) return PrivacyPoolError.InvalidPlatformFeeAccount;
}

pub const InitializeEvent = struct {
    pool: PublicKey,
    token_mint: PublicKey,
    denomination: u64,
    merkle_depth: u8,
};

pub const DepositEvent = struct {
    pool: PublicKey,
    commitment: [32]u8,
    leaf_index: u32,
};

pub const WithdrawEvent = struct {
    pool: PublicKey,
    input_nullifier: [2][32]u8,
    output_commitment: [2][32]u8,
};

pub const PauseEvent = struct {
    pool: PublicKey,
    paused: bool,
};

pub const SwapEvent = struct {
    pool: PublicKey,
    source_mint: PublicKey,
    destination_mint: PublicKey,
    in_amount: u64,
    quoted_out_amount: u64,
};

test "swap vault validation: source mint uses vault" {
    const pool_key = PublicKey.from([_]u8{1} ** 32);
    const pool_mint = PublicKey.from([_]u8{2} ** 32);
    const source_mint = pool_mint;
    const destination_mint = PublicKey.from([_]u8{3} ** 32);
    const vault = PoolVault.derivePda(pool_key, PROGRAM_ID).address;

    try validateSwapVaults(
        pool_key,
        pool_mint,
        source_mint,
        destination_mint,
        vault,
        PublicKey.from([_]u8{4} ** 32),
    );
}

test "swap vault validation: destination mint uses vault" {
    const pool_key = PublicKey.from([_]u8{5} ** 32);
    const pool_mint = PublicKey.from([_]u8{6} ** 32);
    const source_mint = PublicKey.from([_]u8{7} ** 32);
    const destination_mint = pool_mint;
    const vault = PoolVault.derivePda(pool_key, PROGRAM_ID).address;

    try validateSwapVaults(
        pool_key,
        pool_mint,
        source_mint,
        destination_mint,
        PublicKey.from([_]u8{8} ** 32),
        vault,
    );
}

test "swap vault validation: rejects non-vault account" {
    const pool_key = PublicKey.from([_]u8{9} ** 32);
    const pool_mint = PublicKey.from([_]u8{10} ** 32);
    const source_mint = pool_mint;
    const destination_mint = pool_mint;

    try std.testing.expectError(
        PrivacyPoolError.InvalidVaultAccount,
        validateSwapVaults(
            pool_key,
            pool_mint,
            source_mint,
            destination_mint,
            PublicKey.from([_]u8{11} ** 32),
            PublicKey.from([_]u8{12} ** 32),
        ),
    );
}

test "swap authority id validation" {
    try validateSwapAuthorityId(0);
    try std.testing.expectError(
        PrivacyPoolError.InvalidSwapAuthorityId,
        validateSwapAuthorityId(8),
    );
}

test "user transfer authority validation" {
    const pool_mint = PublicKey.from([_]u8{13} ** 32);
    const pool_pda = PublicKey.findProgramAddress(
        .{ PoolState.SEEDS_PREFIX, pool_mint.bytes[0..] },
        PROGRAM_ID,
    ) catch unreachable;

    try validateUserTransferAuthority(pool_mint, pool_pda.bump_seed[0], pool_pda.address);
    try std.testing.expectError(
        PrivacyPoolError.InvalidUserTransferAuthority,
        validateUserTransferAuthority(
            pool_mint,
            pool_pda.bump_seed[0],
            PublicKey.from([_]u8{14} ** 32),
        ),
    );
}

test "token_2022 program validation" {
    var lamports: u64 = 0;
    var data: [1]u8 = [_]u8{0};
    var owner = PublicKey.from([_]u8{21} ** 32);

    var token_id = sol.spl.token.ID;
    const token_info = makeAccountInfo(&token_id, &owner, data[0..], &lamports, false);
    try validateToken2022Program(&token_info);

    var token2022_id = TOKEN_2022_PROGRAM_ID;
    const token2022_info = makeAccountInfo(&token2022_id, &owner, data[0..], &lamports, false);
    try validateToken2022Program(&token2022_info);

    var bad_id = PublicKey.from([_]u8{22} ** 32);
    const bad_info = makeAccountInfo(&bad_id, &owner, data[0..], &lamports, false);
    try std.testing.expectError(
        PrivacyPoolError.InvalidToken2022Program,
        validateToken2022Program(&bad_info),
    );
}

test "platform fee account validation" {
    var lamports: u64 = 0;
    var owner = sol.spl.token.ID;
    const destination_mint = PublicKey.from([_]u8{31} ** 32);
    const token_owner = PublicKey.from([_]u8{32} ** 32);

    var account = token_state.Account{
        .mint = destination_mint,
        .owner = token_owner,
        .amount = 1,
        .delegate = token_state.COption(PublicKey).none(),
        .state = token_state.AccountState.Initialized,
        .is_native = token_state.COption(u64).none(),
        .delegated_amount = 0,
        .close_authority = token_state.COption(PublicKey).none(),
    };

    var data: [token_state.Account.SIZE]u8 = undefined;
    try account.packIntoSlice(&data);

    const good_info = makeAccountInfo(&destination_mint, &owner, data[0..], &lamports, true);
    try validatePlatformFeeAccount(&good_info, destination_mint, owner, 1);

    account.mint = PublicKey.from([_]u8{33} ** 32);
    try account.packIntoSlice(&data);
    const wrong_mint = makeAccountInfo(&destination_mint, &owner, data[0..], &lamports, true);
    try std.testing.expectError(
        PrivacyPoolError.InvalidPlatformFeeAccount,
        validatePlatformFeeAccount(&wrong_mint, destination_mint, owner, 1),
    );

    const bad_owner = PublicKey.from([_]u8{34} ** 32);
    const wrong_owner = makeAccountInfo(&destination_mint, &bad_owner, data[0..], &lamports, true);
    try std.testing.expectError(
        PrivacyPoolError.InvalidPlatformFeeAccount,
        validatePlatformFeeAccount(&wrong_owner, destination_mint, owner, 1),
    );

    const not_writable = makeAccountInfo(&destination_mint, &owner, data[0..], &lamports, false);
    try std.testing.expectError(
        PrivacyPoolError.InvalidPlatformFeeAccount,
        validatePlatformFeeAccount(&not_writable, destination_mint, owner, 1),
    );
}

fn makeAccountInfo(
    id: *const PublicKey,
    owner_id: *const PublicKey,
    data: []u8,
    lamports: *u64,
    is_writable: bool,
) AccountInfo {
    return .{
        .id = id,
        .lamports = lamports,
        .data_len = data.len,
        .data = data.ptr,
        .owner_id = owner_id,
        .is_signer = 0,
        .is_writable = @intFromBool(is_writable),
        .is_executable = 0,
    };
}

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
