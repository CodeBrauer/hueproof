export interface Reference {
  label: string;
  url: string;
}

/** Sources for the methods used in the analysis. DOIs were checked against Crossref. */
export const REFERENCES = {
  wcagContrast: {
    label: "WCAG 2.2, Success Criterion 1.4.3",
    url: "https://www.w3.org/TR/WCAG22/#contrast-minimum",
  },
  apca: { label: "APCA", url: "https://github.com/Myndex/SAPC-APCA" },
  visionModel: {
    label: "Machado, Oliveira & Fernandes (2009)",
    url: "https://doi.org/10.1109/TVCG.2009.113",
  },
  colorDifference: { label: "CIEDE2000 (Sharma, Wu & Dalal)", url: "https://doi.org/10.1002/col.20070" },
  colorHeat: { label: "Ou, Luo, Woodcock & Wright (2004)", url: "https://doi.org/10.1002/col.20010" },
  prevalence: {
    label: "MedlinePlus Genetics (NIH)",
    url: "https://medlineplus.gov/genetics/condition/color-vision-deficiency/",
  },
  prevalenceAchromatopsia: {
    label: "MedlinePlus Genetics: Achromatopsia",
    url: "https://medlineplus.gov/genetics/condition/achromatopsia/",
  },
  prevalenceByPopulation: { label: "Birch (2012)", url: "https://doi.org/10.1364/JOSAA.29.000313" },
  colorVisionAndAge: { label: "Schneck et al. (2014)", url: "https://doi.org/10.1097/OPX.0000000000000152" },
  colorPsychologyReview: {
    label: "Elliot & Maier (2014)",
    url: "https://doi.org/10.1146/annurev-psych-010213-115035",
  },
} as const satisfies Record<string, Reference>;
