## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端 Vue3 SPA"
        A["角色切换层"] --> B["工作区 Tab 切换"]
        B --> C["摊位列表工作区"]
        B --> D["投诉详情工作区"]
        B --> E["巡查录入工作区"]
        B --> F["整改对比工作区"]
    end
    subgraph "数据层"
        G["Pinia Store"] --> H["localStorage 持久化"]
    end
    C --> G
    D --> G
    E --> G
    F --> G
```

纯前端 SPA 架构，无后端服务。所有业务数据通过 Pinia Store 管理，自动同步到浏览器 localStorage。

## 2. 技术说明

- **前端框架**：Vue 3 + TypeScript + Vite
- **样式方案**：Tailwind CSS
- **路由**：Vue Router（单页面 Tab 切换为主）
- **状态管理**：Pinia + pinia-plugin-persistedstate（localStorage 持久化）
- **图表**：Chart.js + vue-chartjs（油烟趋势折线图）
- **图标**：lucide-vue-next
- **后端**：无
- **数据库**：localStorage

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 夜市治理工作台主页面，包含角色切换和四个工作区 Tab |

## 4. API 定义

无后端 API，所有数据通过 localStorage 读写。

## 5. 服务端架构

不适用

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Stall" ||--o{ "Complaint" : "receives"
    "Stall" ||--o{ "Inspection" : "inspected"
    "Stall" ||--o{ "Rectification" : "requires"
    "Stall" {
        string id PK
        string name
        string vendorName
        string vendorIdCard
        string category
        string licenseStatus
        string gasCylinderStatus
        string businessHours
        string position
        string applicationStatus
        string auditStatus
    }
    "Complaint" {
        string id PK
        string stallId FK
        string content
        string recordingUrl
        string status
        int complaintCount
        string createdAt
    }
    "Inspection" {
        string id PK
        string stallId FK
        float oilFumeValue
        string roadOccupation
        float noiseLevel
        string photos
        string createdAt
    }
    "Rectification" {
        string id PK
        string stallId FK
        string beforePhoto
        string afterPhoto
        string status
        string description
        string createdAt
        string completedAt
    }
```

### 6.2 数据定义

使用 TypeScript 接口定义，通过 Pinia Store + localStorage 持久化。初始数据在首次加载时写入 localStorage。

关键枚举：
- `LicenseStatus`: complete / incomplete / expired
- `GasCylinderStatus`: safe / warning / danger
- `AuditStatus`: pending / approved / rejected
- `RectificationStatus`: pending / in_progress / completed
- `ComplaintStatus`: pending / processing / resolved
