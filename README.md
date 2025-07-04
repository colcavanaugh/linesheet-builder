# 🎨 Gilty Boy Line Sheet Builder

> Professional wholesale catalog generator with Airtable integration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)](https://nodejs.org/)

## ✨ Features

- **🔗 Airtable Integration** - Sync product data automatically
- **📄 PDF Export** - High-quality catalogs with working links
- **🎨 Custom Fonts** - Brand-consistent typography
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **⚡ Fast Generation** - Create professional line sheets in seconds
- **🎯 Non-Technical Friendly** - Simple interface for business users
- **📊 Multiple Templates** - Modern, classic, and minimal layouts
- **🔄 Live Preview** - See changes in real-time

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Airtable account with product database
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gilty-boy-linesheet-builder.git
cd gilty-boy-linesheet-builder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Airtable credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📋 Airtable Setup

### Required Fields
Your Airtable base should have a "Products" table with these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| `Product Code` | Single line text | Unique identifier (e.g., A001) |
| `Product Name` | Single line text | Display name |
| `Material` | Single select | Sterling Silver, Bronze, etc. |
| `Retail Price` | Currency | MSRP |
| `Wholesale Price` | Currency | Your wholesale cost |
| `Variations` | Long text | Size options, colors, etc. |
| `Images` | Attachment | Product photos |
| `Category` | Single select | Rings, Necklaces, etc. |
| `Active` | Checkbox | Include in line sheet |

### API Configuration
1. Get your [Airtable API key](https://airtable.com/developers/web/api/introduction)
2. Find your Base ID in the API documentation
3. Add to `.env` file

## 🎨 Customization

### Adding Custom Fonts
1. Place font files in `public/fonts/`
2. Update `src/styles/fonts.css`
3. Select in the font dropdown

### Template Modification
Templates are in `templates/linesheet/`:
- `modern/` - Clean, contemporary design
- `classic/` - Traditional wholesale catalog
- `minimal/` - Simple, text-focused layout

## 📚 Usage Guide

### For Business Users
1. **Update Products** - Add/edit items in Airtable
2. **Generate Line Sheet** - Click "Connect Airtable" → "Generate"
3. **Customize** - Choose fonts, layouts, branding
4. **Export** - Download PDF or share link

### For Developers
- See `docs/api/` for technical documentation
- Check `docs/deployment/` for hosting instructions
- Review `tests/` for example usage

## 🛠️ Development

```bash
# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## 🚀 Deployment

### Netlify (Recommended)
```bash
npm run deploy
```

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- 📖 [User Guide](docs/user-guide/)
- 🐛 [Report Issues](https://github.com/your-username/gilty-boy-linesheet-builder/issues)
- 💬 [Discussions](https://github.com/your-username/gilty-boy-linesheet-builder/discussions)

## 🗺️ Roadmap

- [ ] Bulk pricing updates
- [ ] Client-specific pricing tiers
- [ ] Email integration for sending line sheets
- [ ] Inventory tracking
- [ ] Order form generation
- [ ] Multi-language support

---

**Made with ❤️ for independent jewelry designers**
