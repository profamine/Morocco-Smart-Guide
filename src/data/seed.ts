import { doc, writeBatch, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { MONUMENTS } from './monuments';

// Helper to download image and upload to Firebase Storage
async function migrateImageToStorage(imageUrl: string, monumentId: string | number): Promise<string> {
  try {
    // Some wikimedia URLs might be blocked by CORS in the browser,
    // so we attempt to fetch directly.
    // Use allorigins to avoid CORS and rate limiting from a single IP, plus add User-Agent
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'MoroccoMonumentsApp/1.0 (contact: info@example.com)'
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    
    // Extract a reasonable filename, defaulting to the ID if we can't parse one
    const urlParts = imageUrl.split('/');
    const filename = decodeURIComponent(urlParts[urlParts.length - 1] || `${monumentId}.jpg`);
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `monuments/${monumentId}_${filename}`);
    await uploadBytes(storageRef, blob);
    
    // Return the new URL
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error(`Failed to migrate image for monument ${monumentId}:`, error);
    // Fallback to original URL if upload fails (e.g., Storage bucket not enabled or CORS issue)
    return imageUrl;
  }
}

export const seedDatabase = async () => {
  try {
    const batch = writeBatch(db);
    
    // Format existing monuments
    const formattedExisting = MONUMENTS.map(m => ({
        id: String(m.id),
        nom: m.name,
        ville: m.city,
        region: "Maroc",
        latitude: m.latitude,
        longitude: m.longitude,
        categorie: m.category,
        description: m.description,
        histoire: m.history || "Information historique non disponible.",
        horaires: "9h00 - 18h00",
        tarif: "Gratuit",
        accessibilite: "Oui",
        dureeVisite: "1 heure",
        originalImageUrl: m.image, // Keep track of original
        images: [m.image], 
        audioGuide: "Non disponible",
        noteMoyenne: 4.5
    }));

    // Start with 1 so it triggers a re-seed if the user was on seedVersion 1
    const targetSeedVersion = 4;

    // To prevent browser from freezing, we could process in smaller chunks or sequentially
    console.log("Starting image migration and database seeding...");
    for (const monument of formattedExisting) {
      // Re-host the image
      if (monument.originalImageUrl) {
        console.log(`Migrating image for ${monument.nom}...`);
        const newUrl = await migrateImageToStorage(monument.originalImageUrl, monument.id);
        monument.images = [newUrl];
        // Add a 500ms delay to avoid rate limiting on image downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const docRef = doc(db, 'monuments_v2', String(monument.id));
      batch.set(docRef, monument);
    }
    
    // Set meta doc
    batch.set(doc(db, 'meta', 'app_v2'), { seeded: true, seedVersion: targetSeedVersion });

    await batch.commit();
    console.log(`Seeded ${formattedExisting.length} monuments successfully.`);
    return true;
  } catch (error) {
    console.error("Error seeding database: ", error);
    return false;
  }
};
