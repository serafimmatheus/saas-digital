export function createSlug(text: string): string {
  // Normalize the text to NFD form to separate diacritics from letters
  const normalizedText = text.normalize('NFD')

  // Use a regex to remove diacritics
  const withoutDiacritics = normalizedText.replace(/[\u0300-\u036f]/g, '')

  // Replace spaces and other non-alphanumeric characters with a hyphen
  const slug = withoutDiacritics
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove all non-word characters except hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-+/, '') // Trim hyphens from the start
    .replace(/-+$/, '') // Trim hyphens from the end

  return slug
}
