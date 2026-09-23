# Postman Collection for Testing Nestory API

## Setting up Postman Environment

Create a new environment in Postman with the following variables:

- `base_url`: http://localhost:5000
- `token`: (will be set automatically after login/register)

## API Endpoints

### 1. Register User

**Method:** POST  
**URL:** `{{base_url}}/api/auth/register`  
**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Test Script (Optional):**

```javascript
if (pm.response.code === 201) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
}
```

---

### 2. Login User

**Method:** POST  
**URL:** `{{base_url}}/api/auth/login`  
**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Test Script (Optional):**

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
}
```

---

### 3. Get Current User Profile

**Method:** GET  
**URL:** `{{base_url}}/api/auth/me`  
**Headers:**

```
Authorization: Bearer {{token}}
```

---

### 4. Update User Profile

**Method:** PUT  
**URL:** `{{base_url}}/api/auth/profile`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "name": "John Updated",
  "phoneNumber": "1234567890",
  "profilePicture": "https://example.com/picture.jpg"
}
```

---

### 5. Get All Users (Admin Only)

**Method:** GET  
**URL:** `{{base_url}}/api/auth/users`  
**Headers:**

```
Authorization: Bearer {{token}}
```

**Note:** User must have admin role

---

### 6. Delete User (Admin Only)

**Method:** DELETE  
**URL:** `{{base_url}}/api/auth/users/:id`  
**Headers:**

```
Authorization: Bearer {{token}}
```

**URL Parameters:**

- `id`: User ID to delete

**Note:** User must have admin role

---

### 7. List Assignments (Filters + Pagination)

**Method:** GET  
**URL:** `{{base_url}}/api/assignments?status=assigned&dueState=due_soon&dueSoonDays=5&page=1&limit=10&sortBy=dueDate&sortOrder=asc`  
**Headers:**

```
Authorization: Bearer {{token}}
```

**Optional Query Params:**

- `childId`
- `status` (`assigned` | `in_progress` | `completed`)
- `dueState` (`all` | `overdue` | `due_soon` | `upcoming` | `none`)
- `dueSoonDays` (1-30)
- `page`
- `limit` (max 100)
- `sortBy` (`createdAt` | `dueDate` | `status`)
- `sortOrder` (`asc` | `desc`)

**Expected result highlights:**

- `data[]` contains assignment records with `dueMeta`, `dueState`, `isOverdue`, `isDueSoon`, `daysUntilDue`
- `pagination` object for UI paging
- `metadata.overdueCount` and `metadata.dueSoonCount` for dashboard badges

---

### 8. Bulk Update Assignment Status (Optional)

**Method:** PUT  
**URL:** `{{base_url}}/api/assignments/bulk/status`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "assignmentIds": ["6612f4ef1cf0db7f5f8f0a12", "6612f4ef1cf0db7f5f8f0a13"],
  "status": "completed"
}
```

**Expected result highlights:**

- `requestedCount` and `updatedCount`
- `notFoundIds` for IDs not owned/found
- updated `assignments[]` with due metadata

---

## Creating an Admin User

To create an admin user, you can either:

1. **Manually update in MongoDB:**
   - Register a normal user first
   - Use MongoDB Compass or mongo shell to update the user's role to 'admin'

   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } },
   );
   ```

2. **Or modify the register endpoint temporarily** to accept role in request body

---

## Testing Workflow

1. **Register** a new user (saves token automatically)
2. **Login** with the registered user (updates token)
3. **Get Profile** to verify authentication
4. **Update Profile** to test profile modification
5. Create an admin user and test admin endpoints

---

## Expected Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```
