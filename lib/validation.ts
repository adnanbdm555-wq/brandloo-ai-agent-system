import { z } from "zod";

const baseRegisterFields = {
  name: z.string().min(2, "Name is too short").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};

export const registerSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("create"),
    agencyName: z.string().min(2, "Agency name is too short").max(150),
    ...baseRegisterFields,
  }),
  z.object({
    mode: z.literal("join"),
    inviteCode: z.string().min(1, "Enter an invite code"),
    ...baseRegisterFields,
  }),
]);

// Every field is optional except name — brands can be filled in gradually
// as the agency learns more about the client.
export const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(200),
  industry: z.string().max(200).optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  targetAudience: z.string().max(3000).optional().or(z.literal("")),
  products: z.string().max(3000).optional().or(z.literal("")),
  services: z.string().max(3000).optional().or(z.literal("")),
  usp: z.string().max(2000).optional().or(z.literal("")),
  brandColors: z.array(z.string()).optional(),
  typography: z.string().max(300).optional().or(z.literal("")),
  logoUrl: z.string().max(500).optional().or(z.literal("")),
  toneOfVoice: z.string().max(500).optional().or(z.literal("")),
  communicationStyle: z.string().max(500).optional().or(z.literal("")),
  primaryLanguage: z.string().max(100).optional().or(z.literal("")),
  secondaryLanguage: z.string().max(100).optional().or(z.literal("")),
  socialPlatforms: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  approvedCtas: z.array(z.string()).optional(),
  forbiddenWords: z.array(z.string()).optional(),
  requiredHashtags: z.array(z.string()).optional(),
  location: z.string().max(300).optional().or(z.literal("")),
  contactInformation: z.string().max(1000).optional().or(z.literal("")),
});

export const knowledgeSchema = z.object({
  category: z.enum([
    "COMPANY_INFORMATION",
    "PRODUCTS",
    "SERVICES",
    "FAQS",
    "USPS",
    "TARGET_AUDIENCE",
    "CUSTOMER_PAIN_POINTS",
    "CUSTOMER_BENEFITS",
    "COMPETITORS",
    "BRAND_VOICE",
    "CAMPAIGN_HISTORY",
    "PREVIOUS_CONTENT",
    "APPROVED_CLAIMS",
    "RESTRICTED_CLAIMS",
    "VISUAL_GUIDELINES",
    "MARKETING_OBJECTIVES",
  ]),
  title: z.string().min(1, "Title is required").max(300),
  content: z.string().min(1, "Content is required").max(20000),
});

export const campaignSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(1, "Campaign name is required").max(200),
  objective: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  targetPlatforms: z.array(z.string()).optional(),
});

export const contentGenerateSchema = z.object({
  brandId: z.string().min(1),
  campaignId: z.string().optional().or(z.literal("")),
  platform: z.string().min(1, "Platform is required"),
  contentType: z
    .enum(["POST", "REEL", "STORY", "CAROUSEL", "VIDEO", "ARTICLE"])
    .default("POST"),
  brief: z.string().min(3, "Give the agent a brief to work from").max(2000),
});

export const contentItemUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().min(1).optional(),
  hashtags: z.array(z.string()).optional(),
  platform: z.string().optional(),
  contentType: z
    .enum(["POST", "REEL", "STORY", "CAROUSEL", "VIDEO", "ARTICLE"])
    .optional(),
  status: z.enum(["DRAFT", "READY"]).optional(),
  scheduledDate: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
});

export const approvalActionSchema = z.object({
  notes: z.string().max(2000).optional().or(z.literal("")),
});
