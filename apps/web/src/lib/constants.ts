export const CATEGORIES = [
  "Electronics",
  "ID Cards",
  "Books and Notes",
  "Bags",
  "Keys",
  "Clothing",
  "Accessories",
  "Water Bottles",
  "Other",
] as const;

export const ITEM_TYPES = [
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
] as const;

export const EXAMPLE_ITEMS = [
  {
    id: "example-earbuds",
    title: "Black wireless earbuds",
    description: "Charging case with a scratch near the hinge. Last seen by the library entrance.",
    type: "lost" as const,
    category: "Electronics",
    location: "Library entrance",
    eventDate: "2026-10-21T12:00:00.000Z",
    status: "approved" as const,
    imageUrl: null,
    contactPreference: "in_app" as const,
    createdAt: "2026-10-21T12:00:00.000Z",
    updatedAt: "2026-10-21T12:00:00.000Z",
  },
  {
    id: "example-card",
    title: "Student ID card",
    description: "A campus card left on a reading room table.",
    type: "found" as const,
    category: "ID Cards",
    location: "Main library",
    eventDate: "2026-10-22T12:00:00.000Z",
    status: "approved" as const,
    imageUrl: null,
    contactPreference: "in_app" as const,
    createdAt: "2026-10-22T12:00:00.000Z",
    updatedAt: "2026-10-22T12:00:00.000Z",
  },
];
