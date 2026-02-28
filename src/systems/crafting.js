import { CRAFTING_RECIPES } from '../data/crafting_recipes.js';

export class CraftingSystem {
  findRecipe(baseId, coreId, scrollId = null) {
    return CRAFTING_RECIPES.find(r => {
      const inputs = r.inputs;
      if (inputs.base !== baseId) return false;
      if (inputs.core !== coreId) return false;
      if (scrollId && inputs.scroll !== scrollId) return false;
      if (!scrollId && inputs.scroll !== null) return false;
      return true;
    });
  }

  canCraft(inventory, baseId, coreId, scrollId = null) {
    const recipe = this.findRecipe(baseId, coreId, scrollId);
    if (!recipe) return { ok: false, reason: 'No recipe found for these materials.' };
    if (!inventory.hasItem(baseId)) return { ok: false, reason: `Missing: ${baseId}` };
    if (!inventory.hasItem(coreId)) return { ok: false, reason: `Missing: ${coreId}` };
    if (scrollId && !inventory.hasItem(scrollId)) return { ok: false, reason: `Missing: ${scrollId}` };
    return { ok: true, recipe };
  }

  craft(inventory, baseId, coreId, scrollId = null) {
    const check = this.canCraft(inventory, baseId, coreId, scrollId);
    if (!check.ok) return { success: false, reason: check.reason };
    inventory.removeItem(baseId, 1);
    inventory.removeItem(coreId, 1);
    if (scrollId) inventory.removeItem(scrollId, 1);
    const recipe = check.recipe;
    inventory.addItem(recipe.result.id, 1, recipe.result);
    return { success: true, item: recipe.result };
  }

  getAvailableRecipes(inventory) {
    return CRAFTING_RECIPES.filter(r => {
      if (!inventory.hasItem(r.inputs.base)) return false;
      if (!inventory.hasItem(r.inputs.core)) return false;
      if (r.inputs.scroll && !inventory.hasItem(r.inputs.scroll)) return false;
      return true;
    });
  }
}
