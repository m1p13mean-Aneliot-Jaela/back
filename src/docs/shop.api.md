# API Documentation - Shop Management

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Modèle de données](#modèle-de-données)
3. [Endpoints Shop](#endpoints-shop)
4. [Endpoints Category](#endpoints-category)
5. [Codes d'erreur](#codes-derreur)

---

## Vue d'ensemble

L'API de gestion des boutiques permet de créer, modifier, supprimer et gérer le statut des boutiques ainsi que leurs catégories.

### Statuts des boutiques
- **pending** : Boutique en attente de validation
- **validated** : Boutique validée par l'admin
- **active** : Boutique active et visible
- **deactivated** : Boutique désactivée
- **suspended** : Boutique suspendue temporairement

---

## Modèle de données

### Shop Object

```json
{
  "id": "ObjectId",
  "shop_name": "string (required)",
  "description": "string",
  "logo": "string (URL)",
  "mall_location": "string",
  "opening_time": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" },
    "wednesday": { "open": "09:00", "close": "18:00" },
    "thursday": { "open": "09:00", "close": "18:00" },
    "friday": { "open": "09:00", "close": "18:00" },
    "saturday": { "open": "10:00", "close": "17:00" },
    "sunday": { "open": "10:00", "close": "17:00" }
  },
  "created_at": "Date",
  "users": [{
    "user_id": "ObjectId",
    "role": "MANAGER_SHOP | STAFF",
    "assigned_at": "Date",
    "first_name": "string",
    "last_name": "string"
  }],
  "current_status": {
    "status": "pending | validated | active | deactivated | suspended",
    "reason": "string",
    "updated_at": "Date"
  },
  "status_history": [{
    "status": "string",
    "reason": "string",
    "updated_at": "Date"
  }],
  "categories": [{
    "category_id": "ObjectId",
    "name": "string",
    "assigned_at": "Date"
  }],
  "review_stats": {
    "average_rating": "number",
    "total_reviews": "number"
  }
}
```

### Category Object

```json
{
  "id": "ObjectId",
  "name": "string (required, unique)",
  "description": "string",
  "parent_category_id": "ObjectId | null",
  "ancestors": ["ObjectId"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Endpoints Shop

### 1. Créer une boutique

**POST** `/api/shops/admin`

**Authentification** : Requise (Admin)

**Body** :
```json
{
  "shop_name": "Ma Boutique",
  "description": "Description de la boutique",
  "logo": "https://example.com/logo.png",
  "mall_location": "Centre commercial XYZ",
  "opening_time": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" }
  }
}
```

**Response** : `201 Created`

---

### 2. Obtenir toutes les boutiques

**GET** `/api/shops/admin`

**Query Parameters** :
- `page` : Numéro de page
- `limit` : Éléments par page
- `status` : Filtrer par statut
- `search` : Recherche textuelle

---

### 3. Obtenir une boutique par ID

**GET** `/api/shops/admin/:id`

---

### 4. Modifier une boutique

**PUT** `/api/shops/admin/:id`

**Body** : Champs à modifier (tous optionnels)

---

### 5. Mettre à jour le statut

**PATCH** `/api/shops/admin/:id/status`

**Body** :
```json
{
  "status": "active",
  "reason": "Raison optionnelle"
}
```

Cette méthode met à jour le `current_status` ET ajoute une entrée dans `status_history`.

---

### 6. Valider une boutique

**PATCH** `/api/shops/admin/:id/validate`

Change le statut de `pending` à `validated`.

---

### 7. Activer une boutique

**PATCH** `/api/shops/admin/:id/activate`

Change le statut à `active`.

---

### 8. Désactiver une boutique

**PATCH** `/api/shops/admin/:id/deactivate`

**Body** :
```json
{
  "reason": "Raison de la désactivation (minimum 10 caractères)"
}
```

Change le statut à `deactivated`.

---

### 9. Suspendre une boutique

**PATCH** `/api/shops/admin/:id/suspend`

**Body** :
```json
{
  "reason": "Raison de la suspension (minimum 10 caractères)"
}
```

Change le statut à `suspended`.

---

### 10. Supprimer une boutique

**DELETE** `/api/shops/admin/:id`

Suppression définitive (hard delete).

---

### 11. Ajouter une catégorie à une boutique

**POST** `/api/shops/admin/:id/categories`

**Body** :
```json
{
  "category_id": "ObjectId",
  "name": "Nom de la catégorie"
}
```

---

### 12. Retirer une catégorie d'une boutique

**DELETE** `/api/shops/admin/:id/categories/:categoryId`

---

### 13. Ajouter un utilisateur à une boutique

**POST** `/api/shops/admin/:id/users`

**Body** :
```json
{
  "user_id": "ObjectId",
  "role": "MANAGER_SHOP | STAFF",
  "first_name": "Jean",
  "last_name": "Dupont"
}
```

---

### 14. Retirer un utilisateur d'une boutique

**DELETE** `/api/shops/admin/:id/users/:userId`

---

### 15. Modifier le rôle d'un utilisateur

**PATCH** `/api/shops/admin/:id/users/:userId/role`

**Body** :
```json
{
  "role": "MANAGER_SHOP | STAFF"
}
```

---

### 16. Obtenir les statistiques

**GET** `/api/shops/admin/analytics/stats`

**Response** :
```json
{
  "success": true,
  "data": {
    "total": 150,
    "by_status": {
      "pending": 10,
      "validated": 15,
      "active": 100,
      "deactivated": 20,
      "suspended": 5
    }
  }
}
```

---

### 17. Rechercher des boutiques

**GET** `/api/shops/admin/search?q=terme`

---

### 18. Obtenir les boutiques par catégorie

**GET** `/api/shops/admin/category/:categoryId`

---

### 19. Obtenir les boutiques par statut

**GET** `/api/shops/admin/status/:status`

---

## Endpoints Category

### 1. Créer une catégorie

**POST** `/api/categories/admin`

**Body** :
```json
{
  "name": "Mode",
  "description": "Catégorie mode et vêtements",
  "parent_category_id": "ObjectId (optional)"
}
```

---

### 2. Obtenir toutes les catégories

**GET** `/api/categories/admin`

**Query Parameters** :
- `page` : Numéro de page
- `limit` : Éléments par page (default: 50)

---

### 3. Obtenir une catégorie par ID

**GET** `/api/categories/admin/:id`

---

### 4. Obtenir l'arbre des catégories

**GET** `/api/categories/admin/tree`

Retourne la structure hiérarchique complète des catégories.

---

### 5. Obtenir les catégories racines

**GET** `/api/categories/admin/root`

Retourne les catégories sans parent.

---

### 6. Obtenir les enfants d'une catégorie

**GET** `/api/categories/admin/:id/children`

---

### 7. Obtenir tous les descendants d'une catégorie

**GET** `/api/categories/admin/:id/descendants`

---

### 8. Modifier une catégorie

**PUT** `/api/categories/admin/:id`

**Body** :
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "parent_category_id": "ObjectId (optional)"
}
```

---

### 9. Supprimer une catégorie

**DELETE** `/api/categories/admin/:id`

**Note** : Une catégorie ne peut être supprimée que si elle n'a pas de sous-catégories.

---

### 10. Rechercher des catégories

**GET** `/api/categories/admin/search?q=terme`

**Query Parameters** :
- `q` : Terme de recherche (required, min 2 caractères)
- `page` : Numéro de page
- `limit` : Éléments par page

---

## Codes d'erreur

### 400 Bad Request
- Données de validation invalides
- Catégorie invalide
- Statut invalide
- Tentative de créer une relation circulaire de catégories

### 401 Unauthorized
- Token manquant ou invalide

### 403 Forbidden
- Permissions insuffisantes

### 404 Not Found
- Boutique non trouvée
- Catégorie non trouvée

### 409 Conflict
- Nom de catégorie déjà existant

### 500 Internal Server Error
- Erreur serveur

---

## Notes importantes

### Gestion des boutiques

1. **Statuts** : Les boutiques suivent un workflow de validation:
   - `pending` → `validated` → `active`
   - Possibilité de passer à `deactivated` ou `suspended` à tout moment

2. **Historique** : 
   - Toutes les modifications importantes sont tracées dans `update_history`
   - Les changements de statut sont enregistrés dans `status_history`

3. **Catégories** : Une boutique peut avoir plusieurs catégories

4. **Utilisateurs** : Chaque boutique peut avoir plusieurs utilisateurs avec différents rôles (MANAGER_SHOP, STAFF)

### Gestion des catégories

1. **Hiérarchie** : Les catégories supportent une structure hiérarchique avec parents et enfants

2. **Ancêtres** : Le champ `ancestors` permet des requêtes rapides sur toute la hiérarchie

3. **Suppression** : Une catégorie parent ne peut pas être supprimée tant qu'elle a des sous-catégories

4. **Arbre** : L'endpoint `/tree` retourne la structure complète pour l'affichage en arbre

### Permissions

- **Admin** : Accès complet à toutes les fonctionnalités
- **Shop** : Peut consulter les informations des boutiques
