/**
 * @px402/relay - Routing
 *
 * Handles route selection, load balancing, and failover
 */

import { generateMessageId } from './protocol.js';
import type { PeerInfo, Route, RoutingResult } from './types.js';

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Default number of hops */
  defaultHops?: number;

  /** Maximum number of hops */
  maxHops?: number;

  /** Route expiry time (ms) */
  routeExpiry?: number;

  /** Number of alternative routes to compute */
  alternativeRoutes?: number;

  /** Preference for reputation vs fee (0-1, 1 = all reputation) */
  reputationWeight?: number;
}

/**
 * Route selection strategy
 */
export type RouteStrategy =
  | 'lowest-fee'
  | 'highest-reputation'
  | 'balanced'
  | 'random';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<RouterConfig> = {
  defaultHops: 3,
  maxHops: 10,
  routeExpiry: 300000, // 5 minutes
  alternativeRoutes: 2,
  reputationWeight: 0.5,
};

/**
 * Router for selecting relay paths
 */
export class Router {
  private config: Required<RouterConfig>;
  private activeRoutes: Map<string, Route> = new Map();

  constructor(config: RouterConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Find route to destination
   */
  findRoute(
    peers: PeerInfo[],
    options: {
      hops?: number;
      strategy?: RouteStrategy;
      excludeNodes?: string[];
      maxFee?: string;
    } = {}
  ): RoutingResult {
    const hops = Math.min(
      options.hops ?? this.config.defaultHops,
      this.config.maxHops
    );

    if (hops < 1) {
      throw new Error('At least 1 hop is required');
    }

    const excludeSet = new Set(options.excludeNodes ?? []);
    const availablePeers = peers.filter((p) => !excludeSet.has(p.id));

    if (availablePeers.length < hops) {
      throw new Error(
        `Not enough peers for ${hops} hops (available: ${availablePeers.length})`
      );
    }

    const strategy = options.strategy ?? 'balanced';
    const routes: Route[] = [];

    // Generate primary route
    const primaryRoute = this.selectRoute(
      availablePeers,
      hops,
      strategy,
      options.maxFee
    );
    routes.push(primaryRoute);

    // Generate alternative routes
    const usedNodes = new Set(primaryRoute.nodes);
    for (let i = 0; i < this.config.alternativeRoutes; i++) {
      try {
        const altPeers = availablePeers.filter((p) => !usedNodes.has(p.id));
        if (altPeers.length >= hops) {
          const altRoute = this.selectRoute(
            altPeers,
            hops,
            strategy,
            options.maxFee
          );
          routes.push(altRoute);
          altRoute.nodes.forEach((n) => usedNodes.add(n));
        }
      } catch {
        // Not enough peers for alternative route
        break;
      }
    }

    // Store primary route
    this.activeRoutes.set(primaryRoute.id, primaryRoute);

    return {
      route: primaryRoute,
      alternatives: routes.slice(1),
    };
  }

  /**
   * Select nodes for route based on strategy
   */
  private selectRoute(
    peers: PeerInfo[],
    hops: number,
    strategy: RouteStrategy,
    maxFee?: string
  ): Route {
    let selectedPeers: PeerInfo[];

    // Filter by max fee if specified
    let candidatePeers = peers;
    if (maxFee) {
      const maxFeeValue = BigInt(maxFee);
      candidatePeers = peers.filter(
        (p) => BigInt(p.feeConfig.minFee) <= maxFeeValue
      );
    }

    switch (strategy) {
      case 'lowest-fee':
        selectedPeers = this.selectByFee(candidatePeers, hops);
        break;
      case 'highest-reputation':
        selectedPeers = this.selectByReputation(candidatePeers, hops);
        break;
      case 'random':
        selectedPeers = this.selectRandom(candidatePeers, hops);
        break;
      case 'balanced':
      default:
        selectedPeers = this.selectBalanced(candidatePeers, hops);
        break;
    }

    const totalFee = selectedPeers.reduce(
      (sum, p) => sum + BigInt(p.feeConfig.minFee),
      0n
    );

    const now = Date.now();
    return {
      id: generateMessageId(),
      nodes: selectedPeers.map((p) => p.id),
      totalFee: totalFee.toString(),
      createdAt: now,
      expiresAt: now + this.config.routeExpiry,
    };
  }

  /**
   * Select by lowest fee
   */
  private selectByFee(peers: PeerInfo[], count: number): PeerInfo[] {
    const sorted = [...peers].sort((a, b) =>
      BigInt(a.feeConfig.minFee) > BigInt(b.feeConfig.minFee) ? 1 : -1
    );
    return sorted.slice(0, count);
  }

  /**
   * Select by highest reputation
   */
  private selectByReputation(peers: PeerInfo[], count: number): PeerInfo[] {
    const sorted = [...peers].sort((a, b) => b.reputation - a.reputation);
    return sorted.slice(0, count);
  }

  /**
   * Select randomly
   */
  private selectRandom(peers: PeerInfo[], count: number): PeerInfo[] {
    const shuffled = [...peers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Select with balanced score (reputation + fee)
   */
  private selectBalanced(peers: PeerInfo[], count: number): PeerInfo[] {
    // Normalize values
    const maxFee = peers.reduce(
      (max, p) =>
        BigInt(p.feeConfig.minFee) > max ? BigInt(p.feeConfig.minFee) : max,
      0n
    );
    const maxRep = peers.reduce((max, p) => Math.max(max, p.reputation), 0);

    const scored = peers.map((p) => {
      const feeScore =
        maxFee > 0n
          ? 1 - Number(BigInt(p.feeConfig.minFee) * 100n / maxFee) / 100
          : 1;
      const repScore = maxRep > 0 ? p.reputation / maxRep : 0;

      const score =
        this.config.reputationWeight * repScore +
        (1 - this.config.reputationWeight) * feeScore;

      return { peer: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((s) => s.peer);
  }

  /**
   * Get active route by ID
   */
  getRoute(id: string): Route | undefined {
    const route = this.activeRoutes.get(id);
    if (route && route.expiresAt < Date.now()) {
      this.activeRoutes.delete(id);
      return undefined;
    }
    return route;
  }

  /**
   * Invalidate route (e.g., due to failure)
   */
  invalidateRoute(id: string): boolean {
    return this.activeRoutes.delete(id);
  }

  /**
   * Clean up expired routes
   */
  cleanupExpiredRoutes(): number {
    const now = Date.now();
    let count = 0;

    for (const [id, route] of this.activeRoutes) {
      if (route.expiresAt < now) {
        this.activeRoutes.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Get active route count
   */
  getActiveRouteCount(): number {
    return this.activeRoutes.size;
  }

  /**
   * Estimate total fee for a route
   */
  estimateFee(peers: PeerInfo[], hops: number): string {
    // Get lowest fee peers
    const sorted = [...peers].sort((a, b) =>
      BigInt(a.feeConfig.minFee) > BigInt(b.feeConfig.minFee) ? 1 : -1
    );

    const selected = sorted.slice(0, hops);
    const total = selected.reduce(
      (sum, p) => sum + BigInt(p.feeConfig.minFee),
      0n
    );

    return total.toString();
  }

  /**
   * Convert route to peer info list
   */
  getRoutePeers(route: Route, allPeers: PeerInfo[]): PeerInfo[] {
    const peerMap = new Map(allPeers.map((p) => [p.id, p]));
    return route.nodes
      .map((id) => peerMap.get(id))
      .filter((p): p is PeerInfo => p !== undefined);
  }
}

/**
 * Create router instance
 */
export function createRouter(config?: RouterConfig): Router {
  return new Router(config);
}
