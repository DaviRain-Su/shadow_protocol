//! Jupiter CPI adapter for sharedAccountsRoute (V6).
//!
//! Rust source: https://github.com/jup-ag/jupiter-cpi/blob/main/src/lib.rs
//! IDL source: /home/davirain/dev/shadow_protocol/jupiter-cpi/idl.json

const std = @import("std");
const anchor = @import("anchor");
const sol = anchor.sdk;

const AccountInfo = sol.account.Account.Info;
const PublicKey = sol.PublicKey;

/// Jupiter V6 program id.
pub const PROGRAM_ID = PublicKey.comptimeFromBase58(
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
);

/// Anchor discriminator for sharedAccountsRoute.
pub const SHARED_ACCOUNTS_ROUTE_DISCRIMINATOR: [8]u8 = .{ 0xC1, 0x20, 0x9B, 0x33, 0x41, 0xD6, 0x9C, 0x81 };

/// Swap side enum (IDL order: Bid, Ask).
pub const Side = enum(u8) {
    Bid = 0,
    Ask = 1,
};

/// Swap enum tag (IDL order).
pub const SwapTag = enum(u8) {
    Saber = 0,
    SaberAddDecimalsDeposit = 1,
    SaberAddDecimalsWithdraw = 2,
    TokenSwap = 3,
    Sencha = 4,
    Step = 5,
    Cropper = 6,
    Raydium = 7,
    Crema = 8,
    Lifinity = 9,
    Mercurial = 10,
    Cykura = 11,
    Serum = 12,
    MarinadeDeposit = 13,
    MarinadeUnstake = 14,
    Aldrin = 15,
    AldrinV2 = 16,
    Whirlpool = 17,
    Invariant = 18,
    Meteora = 19,
    GooseFX = 20,
    DeltaFi = 21,
    Balansol = 22,
    MarcoPolo = 23,
    Dradex = 24,
    LifinityV2 = 25,
    RaydiumClmm = 26,
    Openbook = 27,
    Phoenix = 28,
    Symmetry = 29,
    TokenSwapV2 = 30,
    HeliumTreasuryManagementRedeemV0 = 31,
    StakeDexStakeWrappedSol = 32,
    StakeDexSwapViaStake = 33,
    GooseFXV2 = 34,
    Perps = 35,
    PerpsAddLiquidity = 36,
    PerpsRemoveLiquidity = 37,
    MeteoraDlmm = 38,
};

/// Swap variant payloads.
pub const Swap = union(SwapTag) {
    Saber: void,
    SaberAddDecimalsDeposit: void,
    SaberAddDecimalsWithdraw: void,
    TokenSwap: void,
    Sencha: void,
    Step: void,
    Cropper: void,
    Raydium: void,
    Crema: struct { a_to_b: bool },
    Lifinity: void,
    Mercurial: void,
    Cykura: void,
    Serum: struct { side: Side },
    MarinadeDeposit: void,
    MarinadeUnstake: void,
    Aldrin: struct { side: Side },
    AldrinV2: struct { side: Side },
    Whirlpool: struct { a_to_b: bool },
    Invariant: struct { x_to_y: bool },
    Meteora: void,
    GooseFX: void,
    DeltaFi: struct { stable: bool },
    Balansol: void,
    MarcoPolo: struct { x_to_y: bool },
    Dradex: struct { side: Side },
    LifinityV2: void,
    RaydiumClmm: void,
    Openbook: struct { side: Side },
    Phoenix: struct { side: Side },
    Symmetry: struct { from_token_id: u64, to_token_id: u64 },
    TokenSwapV2: void,
    HeliumTreasuryManagementRedeemV0: void,
    StakeDexStakeWrappedSol: void,
    StakeDexSwapViaStake: struct { bridge_stake_seed: u32 },
    GooseFXV2: void,
    Perps: void,
    PerpsAddLiquidity: void,
    PerpsRemoveLiquidity: void,
    MeteoraDlmm: void,
};

/// RoutePlanStep struct (Borsh-encoded).
pub const RoutePlanStep = struct {
    swap: Swap,
    percent: u8,
    input_index: u8,
    output_index: u8,
};

/// Arguments for sharedAccountsRoute.
pub const SharedAccountsRouteArgs = struct {
    id: u8,
    route_plan_len: u32,
    in_amount: u64,
    quoted_out_amount: u64,
    slippage_bps: u16,
    platform_fee_bps: u8,
};

/// Build sharedAccountsRoute instruction data without allocator.
///
/// Returns the actual length written. Caller provides buffer.
pub fn buildSharedAccountsRouteDataInto(
    buffer: []u8,
    args: SharedAccountsRouteArgs,
    route_plan_bytes: []const u8,
) !usize {
    const required = 8 + 1 + 4 + route_plan_bytes.len + 8 + 8 + 2 + 1;
    if (buffer.len < required) {
        return error.BufferTooSmall;
    }

    var offset: usize = 0;

    // Discriminator
    @memcpy(buffer[offset..][0..8], &SHARED_ACCOUNTS_ROUTE_DISCRIMINATOR);
    offset += 8;

    // id
    buffer[offset] = args.id;
    offset += 1;

    // route_plan_len
    std.mem.writeInt(u32, buffer[offset..][0..4], args.route_plan_len, .little);
    offset += 4;

    // route_plan_bytes
    @memcpy(buffer[offset..][0..route_plan_bytes.len], route_plan_bytes);
    offset += route_plan_bytes.len;

    // in_amount
    std.mem.writeInt(u64, buffer[offset..][0..8], args.in_amount, .little);
    offset += 8;

    // quoted_out_amount
    std.mem.writeInt(u64, buffer[offset..][0..8], args.quoted_out_amount, .little);
    offset += 8;

    // slippage_bps
    std.mem.writeInt(u16, buffer[offset..][0..2], args.slippage_bps, .little);
    offset += 2;

    // platform_fee_bps
    buffer[offset] = args.platform_fee_bps;
    offset += 1;

    return offset;
}

/// Encode RoutePlanStep list (Borsh, without Vec length prefix).
pub fn encodeRoutePlanSteps(
    allocator: std.mem.Allocator,
    steps: []const RoutePlanStep,
) !struct { bytes: []u8, len: u32 } {
    var list = try std.ArrayList(u8).initCapacity(allocator, steps.len * 8);
    errdefer list.deinit(allocator);

    for (steps) |step| {
        try encodeSwap(&list, allocator, step.swap);
        try list.append(allocator, step.percent);
        try list.append(allocator, step.input_index);
        try list.append(allocator, step.output_index);
    }

    return .{ .bytes = try list.toOwnedSlice(allocator), .len = @truncate(steps.len) };
}

/// Build sharedAccountsRoute instruction data from RoutePlanStep list.
pub fn buildSharedAccountsRouteDataFromSteps(
    allocator: std.mem.Allocator,
    args: SharedAccountsRouteArgs,
    steps: []const RoutePlanStep,
) ![]u8 {
    const encoded = try encodeRoutePlanSteps(allocator, steps);
    defer allocator.free(encoded.bytes);

    const required = 8 + 1 + 4 + encoded.bytes.len + 8 + 8 + 2 + 1;
    var buffer = try allocator.alloc(u8, required);
    const written = try buildSharedAccountsRouteDataInto(buffer, .{
        .id = args.id,
        .route_plan_len = encoded.len,
        .in_amount = args.in_amount,
        .quoted_out_amount = args.quoted_out_amount,
        .slippage_bps = args.slippage_bps,
        .platform_fee_bps = args.platform_fee_bps,
    }, encoded.bytes);
    return buffer[0..written];
}

fn encodeSwap(list: *std.ArrayList(u8), allocator: std.mem.Allocator, swap: Swap) !void {
    const tag = std.meta.activeTag(swap);
    try list.append(allocator, @intFromEnum(tag));

    switch (swap) {
        .Crema => |payload| try appendBool(list, allocator, payload.a_to_b),
        .Serum => |payload| try appendSide(list, allocator, payload.side),
        .Aldrin => |payload| try appendSide(list, allocator, payload.side),
        .AldrinV2 => |payload| try appendSide(list, allocator, payload.side),
        .Whirlpool => |payload| try appendBool(list, allocator, payload.a_to_b),
        .Invariant => |payload| try appendBool(list, allocator, payload.x_to_y),
        .DeltaFi => |payload| try appendBool(list, allocator, payload.stable),
        .MarcoPolo => |payload| try appendBool(list, allocator, payload.x_to_y),
        .Dradex => |payload| try appendSide(list, allocator, payload.side),
        .Openbook => |payload| try appendSide(list, allocator, payload.side),
        .Phoenix => |payload| try appendSide(list, allocator, payload.side),
        .Symmetry => |payload| {
            try appendU64(list, allocator, payload.from_token_id);
            try appendU64(list, allocator, payload.to_token_id);
        },
        .StakeDexSwapViaStake => |payload| try appendU32(list, allocator, payload.bridge_stake_seed),
        else => {},
    }
}

fn appendBool(list: *std.ArrayList(u8), allocator: std.mem.Allocator, value: bool) !void {
    try list.append(allocator, if (value) 1 else 0);
}

fn appendSide(list: *std.ArrayList(u8), allocator: std.mem.Allocator, side: Side) !void {
    try list.append(allocator, @intFromEnum(side));
}

fn appendU32(list: *std.ArrayList(u8), allocator: std.mem.Allocator, value: u32) !void {
    var buf: [4]u8 = undefined;
    std.mem.writeInt(u32, &buf, value, .little);
    try list.appendSlice(allocator, &buf);
}

fn appendU64(list: *std.ArrayList(u8), allocator: std.mem.Allocator, value: u64) !void {
    var buf: [8]u8 = undefined;
    std.mem.writeInt(u64, &buf, value, .little);
    try list.appendSlice(allocator, &buf);
}

test "encodeRoutePlanSteps: length" {
    const allocator = std.testing.allocator;
    const steps = [_]RoutePlanStep{
        .{
            .swap = .Saber,
            .percent = 100,
            .input_index = 0,
            .output_index = 1,
        },
    };

    const encoded = try encodeRoutePlanSteps(allocator, &steps);
    defer allocator.free(encoded.bytes);

    try std.testing.expectEqual(@as(u32, 1), encoded.len);
    try std.testing.expectEqual(@as(usize, 4), encoded.bytes.len);
}

/// Accounts for sharedAccountsRoute CPI.
///
/// Account order matches Jupiter V6 IDL.
/// Uses Account type (not Account.Info) for compatibility with processInstruction.
pub const SharedAccountsRouteAccounts = struct {
    token_program: *const AccountInfo,
    program_authority: *const AccountInfo,
    user_transfer_authority: *const AccountInfo,
    source_token_account: *const AccountInfo,
    program_source_token_account: *const AccountInfo,
    program_destination_token_account: *const AccountInfo,
    destination_token_account: *const AccountInfo,
    source_mint: *const AccountInfo,
    destination_mint: *const AccountInfo,
    platform_fee_account: *const AccountInfo,
    token_2022_program: *const AccountInfo,
    event_authority: *const AccountInfo,
    program: *const AccountInfo,
};

/// Invoke Jupiter sharedAccountsRoute CPI.
///
/// The instruction data should be encoded as Anchor instruction data for
/// sharedAccountsRoute (discriminator + borsh args).
pub fn invokeSharedAccountsRoute(
    accounts: SharedAccountsRouteAccounts,
    data: []const u8,
    signer_seeds: []const []const u8,
) !void {
    const metas = [_]sol.instruction.AccountMeta{
        .{ .pubkey = accounts.token_program.id.*, .is_signer = false, .is_writable = false },
        .{ .pubkey = accounts.program_authority.id.*, .is_signer = false, .is_writable = false },
        .{ .pubkey = accounts.user_transfer_authority.id.*, .is_signer = true, .is_writable = false },
        .{ .pubkey = accounts.source_token_account.id.*, .is_signer = false, .is_writable = true },
        .{ .pubkey = accounts.program_source_token_account.id.*, .is_signer = false, .is_writable = true },
        .{ .pubkey = accounts.program_destination_token_account.id.*, .is_signer = false, .is_writable = true },
        .{ .pubkey = accounts.destination_token_account.id.*, .is_signer = false, .is_writable = true },
        .{ .pubkey = accounts.source_mint.id.*, .is_signer = false, .is_writable = false },
        .{ .pubkey = accounts.destination_mint.id.*, .is_signer = false, .is_writable = false },
        .{ .pubkey = accounts.platform_fee_account.id.*, .is_signer = false, .is_writable = true },
        .{ .pubkey = accounts.token_2022_program.id.*, .is_signer = false, .is_writable = false },
        .{ .pubkey = accounts.event_authority.id.*, .is_signer = false, .is_writable = false },
        .{ .pubkey = accounts.program.id.*, .is_signer = false, .is_writable = false },
    };

    const ix = sol.instruction.Instruction{
        .program_id = &PROGRAM_ID,
        .accounts = &metas,
        .data = data,
    };

    // Get account infos for CPI
    const account_infos = [_]AccountInfo{
        accounts.token_program.*,
        accounts.program_authority.*,
        accounts.user_transfer_authority.*,
        accounts.source_token_account.*,
        accounts.program_source_token_account.*,
        accounts.program_destination_token_account.*,
        accounts.destination_token_account.*,
        accounts.source_mint.*,
        accounts.destination_mint.*,
        accounts.platform_fee_account.*,
        accounts.token_2022_program.*,
        accounts.event_authority.*,
        accounts.program.*,
    };

    const invoke_seeds = [_][]const []const u8{signer_seeds};
    const result = ix.invokeSigned(&account_infos, &invoke_seeds);
    if (result) |err| return err;
}
