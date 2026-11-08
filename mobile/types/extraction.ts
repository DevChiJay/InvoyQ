/** Raw `parsed` object from POST /extract-job-details. It comes from an LLM, so every field may be missing or null. */
export type ExtractedItem = {
  description?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
};

export type ParsedExtraction = {
  jobs?: string[] | null;
  items?: ExtractedItem[] | null;
  deadlines?: string[] | null;
  payment_terms?: string | null;
  amount?: number | null;
  currency?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_address?: string | null;
  confidence?: number | null;
};

export type ExtractionResponse = {
  extraction_id: string;
  parsed: ParsedExtraction;
};

export type ExtractionInput = {
  text?: string;
  /** Local file URI from the image picker. */
  imageUri?: string;
  imageName?: string;
  imageMimeType?: string;
};

export type PrefillItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

/** Extraction result mapped onto what the create-invoice form can take. */
export type InvoicePrefill = {
  items: PrefillItem[];
  /** Local noon on the extracted due date, so toISOString() keeps the same calendar day in any timezone. */
  dueDate?: Date;
  currency?: string;
  notes?: string;
  client: {
    name?: string;
    email?: string;
    address?: string;
  };
  confidence: number;
  /** Descriptions of lines whose price couldn't be determined. */
  needsReview: string[];
};
