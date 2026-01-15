//! Shadow Protocol Build Configuration
//!
//! This build script configures the Shadow Protocol for Solana deployment.
//! Use ./solana-zig/zig to build for SBF target.

const std = @import("std");

pub fn build(b: *std.Build) void {
    // Get the solana-program-sdk dependency
    const solana_dep = b.dependency("solana_program_sdk", .{});

    // Get the main SDK module
    const solana_program_sdk = solana_dep.module("solana_program_sdk");

    // Standard target options for native builds (testing)
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Create anchor module from SDK's anchor source
    const anchor_mod = b.createModule(.{
        .root_source_file = solana_dep.path("anchor/src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    anchor_mod.addImport("solana_program_sdk", solana_program_sdk);

    // ============================================================
    // Shadow Protocol Library Module
    // ============================================================
    const shadow_mod = b.addModule("shadow_protocol", .{
        .root_source_file = b.path("src/lib.zig"),
        .target = target,
        .optimize = optimize,
    });
    shadow_mod.addImport("solana_program_sdk", solana_program_sdk);
    shadow_mod.addImport("anchor", anchor_mod);

    // ============================================================
    // Solana Program (SBF Target)
    // ============================================================

    // SBF target for Solana deployment
    const sbf_target = solana_dep.builder.resolveTargetQuery(.{
        .cpu_arch = .sbf,
        .os_tag = .solana,
    });

    // Create anchor module for SBF target
    const anchor_mod_sbf = b.createModule(.{
        .root_source_file = solana_dep.path("anchor/src/root.zig"),
        .target = sbf_target,
        .optimize = .ReleaseFast,
    });
    const solana_program_sdk_sbf = solana_dep.module("solana_program_sdk");
    anchor_mod_sbf.addImport("solana_program_sdk", solana_program_sdk_sbf);

    // Shadow module for SBF
    const shadow_mod_sbf = b.createModule(.{
        .root_source_file = b.path("src/lib.zig"),
        .target = sbf_target,
        .optimize = .ReleaseFast,
    });
    shadow_mod_sbf.addImport("solana_program_sdk", solana_program_sdk_sbf);
    shadow_mod_sbf.addImport("anchor", anchor_mod_sbf);

    // Privacy Pool Program
    const privacy_pool_program = b.addLibrary(.{
        .name = "shadow_privacy_pool",
        .linkage = .static,
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/programs/privacy_pool.zig"),
            .target = sbf_target,
            .optimize = .ReleaseFast,
        }),
    });
    privacy_pool_program.root_module.addImport("solana_program_sdk", solana_program_sdk_sbf);
    privacy_pool_program.root_module.addImport("anchor", anchor_mod_sbf);
    privacy_pool_program.root_module.addImport("shadow_protocol", shadow_mod_sbf);

    const deploy_step = b.step("deploy", "Build Solana programs for deployment");
    deploy_step.dependOn(&privacy_pool_program.step);

    // ============================================================
    // Tests (Native Target)
    // ============================================================

    // Main library tests
    const lib_tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/lib.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    lib_tests.root_module.addImport("solana_program_sdk", solana_program_sdk);
    lib_tests.root_module.addImport("anchor", anchor_mod);

    const run_lib_tests = b.addRunArtifact(lib_tests);

    // State tests
    const state_tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/state/mod.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    state_tests.root_module.addImport("solana_program_sdk", solana_program_sdk);
    state_tests.root_module.addImport("anchor", anchor_mod);
    const run_state_tests = b.addRunArtifact(state_tests);

    // Groth16 tests
    const groth16_tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/verifier/groth16.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    groth16_tests.root_module.addImport("solana_program_sdk", solana_program_sdk);
    groth16_tests.root_module.addImport("anchor", anchor_mod);
    const run_groth16_tests = b.addRunArtifact(groth16_tests);

    const test_step = b.step("test", "Run all tests");
    test_step.dependOn(&run_lib_tests.step);
    test_step.dependOn(&run_state_tests.step);
    test_step.dependOn(&run_groth16_tests.step);
}
