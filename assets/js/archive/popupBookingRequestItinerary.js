// ===============================================
// Itinerary-only Button Handlers (safe + isolated)
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
  const editBtn = document.getElementById("it-edit-btn");
  const removeBtn = document.getElementById("it-remove-btn");
  const shareBtn = document.getElementById("it-share-btn");

  editBtn?.addEventListener("click", () => {
    alert("Editing itinerary event coming soon!");
  });

  removeBtn?.addEventListener("click", () => {
    alert("Removing itinerary event coming soon!");
  });

  shareBtn?.addEventListener("click", () => {
    alert("Sharing itinerary event coming soon!");
  });
});
