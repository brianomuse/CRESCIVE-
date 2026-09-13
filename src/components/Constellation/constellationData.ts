import { CRESCIVE_CATEGORIES } from "../../data/categories";
import { LifeCategory } from "../../types";

export interface ConstellationNodeData {
  category: LifeCategory;
  position: [number, number, number]; // [x, y, z]
  colorHex: string;
  totalMoves: number;
  completedMoves: number;
  isActive: boolean;
}

export interface ConstellationConnection {
  sourceId: string;
  targetId: string;
  sourceIndex: number;
  targetIndex: number;
  relationType: string;
}

/**
 * 3D Spatial positions for the 15 Life Dimensions.
 * Arranged in a harmonic 3D celestial sphere with natural depth (Z variance)
 * so that it is never a flat circle, but a rich volumetric constellation.
 */
export const CONSTELLATION_NODE_POSITIONS: Record<string, [number, number, number]> = {
  // Knowledge & Mind Core
  "knowledge-learning": [-10, 8, 4],
  "mind-personal-growth": [-12, 1, -5],
  "values-identity": [-6, -4, -10],
  "spirituality-meaning": [-2, -9, -12],

  // Craft, Vocation & Enterprise Core
  "career-work": [8, 9, 3],
  "business-building": [12, 3, 6],
  "money-wealth": [10, -4, 5],
  "time-productivity": [2, 11, -4],
  "goals-direction": [0, 4, -8],

  // Vitality, Life & Creative Expression
  "health-wellness": [-8, -6, 6],
  "life-environment": [-3, -11, 2],
  "creativity-expression": [4, -2, 11],
  "experiences-adventure": [-4, 6, 10],

  // Connection & Social Impact
  "relationships": [7, -8, -6],
  "contribution-impact": [3, -12, -7],
};

/**
 * Meaningful systemic connections between dimensions in CRESCIVE's architecture.
 */
export const CONSTELLATION_CONNECTIONS: Array<{ from: string; to: string; relation: string }> = [
  { from: "knowledge-learning", to: "career-work", relation: "Skill Mastery" },
  { from: "career-work", to: "money-wealth", relation: "Value Creation" },
  { from: "money-wealth", to: "business-building", relation: "Capital Allocation" },
  { from: "career-work", to: "time-productivity", relation: "Deep Work Execution" },
  { from: "time-productivity", to: "goals-direction", relation: "Strategic Focus" },
  { from: "goals-direction", to: "values-identity", relation: "Moral Alignment" },
  { from: "values-identity", to: "mind-personal-growth", relation: "Fortitude & Sovereign Discipline" },
  { from: "mind-personal-growth", to: "health-wellness", relation: "Mind-Body Harmony" },
  { from: "health-wellness", to: "time-productivity", relation: "Vital Energy" },
  { from: "health-wellness", to: "life-environment", relation: "Sanctuary Design" },
  { from: "relationships", to: "contribution-impact", relation: "Communal Elevation" },
  { from: "creativity-expression", to: "business-building", relation: "Originality to Enterprise" },
  { from: "creativity-expression", to: "mind-personal-growth", relation: "Cognitive Intuition" },
  { from: "experiences-adventure", to: "knowledge-learning", relation: "Worldview Expansion" },
  { from: "spirituality-meaning", to: "values-identity", relation: "Enduring Purpose" },
  { from: "contribution-impact", to: "spirituality-meaning", relation: "Legacy & Transcendence" },
  { from: "goals-direction", to: "career-work", relation: "Milestone Teleology" },
  { from: "life-environment", to: "mind-personal-growth", relation: "Low-Friction Habitat" },
];
