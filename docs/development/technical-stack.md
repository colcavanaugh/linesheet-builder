# Technical Stack

## Core Technologies

### Frontend Framework
**Vanilla JavaScript + Modern ES6+**
- **Why:** Simplicity for MVP, no framework overhead
- **Benefits:** Fast loading, easy debugging, direct control
- **Trade-offs:** More manual DOM manipulation vs React convenience

**Alternative Considered:** React
- **Decision:** Vanilla JS chosen for MVP simplicity, React can be added later

### Build Tool
**Vite**
- **Why:** Fast development server, excellent ES6+ support
- **Features:** Hot module replacement, optimized bundling, TypeScript support
- **Configuration:** Zero-config for most use cases

### Styling Solution
**Tailwind CSS + Custom CSS**
- **Tailwind:** Utility-first framework for rapid UI development
- **Custom CSS:** Brand-specific styling and print layouts
- **CSS Variables:** Dynamic theming and customization

### Package Manager
**npm**
- **Why:** Standard, reliable, good ecosystem integration
- **Scripts:** Custom build, test, and deployment workflows

## Backend & Data

### Data Source
**Airtable API**
- **Version:** REST API v0
- **Authentication:** API key-based
- **Rate Limits:** 5 requests per second per base
- **Data Format:** JSON responses

```javascript
// Example API call structure
const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

### API Client
**Airtable.js + Custom Wrapper**
- **Official SDK:** Airtable.js for reliable API communication
- **Custom Layer:** Business logic and error handling
- **Caching:** In-memory caching to reduce API calls

### File Processing
**Native Browser APIs**
- **File API:** Handle image uploads and processing
- **Canvas API:** Image manipulation and optimization
- **Blob API:** File generation for downloads

## Export & Generation

### PDF Generation
**Primary: Puppeteer**
- **Why:** High-quality PDF output, full CSS support
- **Use Case:** Professional print-ready catalogs
- **Dependencies:** Chrome/Chromium runtime

**Fallback: jsPDF + html2canvas**
- **Why:** Client-side generation, no server dependencies
- **Use Case:** Quick previews and basic exports
- **Limitations:** Limited CSS support

```javascript
// Puppeteer implementation approach
const pdf = await page.pdf({
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }
});
```

### Markdown Export
**Marked.js**
- **Why:** Reliable markdown parsing and generation
- **Features:** Custom renderers, extension support
- **Output:** Compatible with most documentation platforms

## Development Tools

### Code Quality
**ESLint + Prettier**
- **ESLint:** Code linting and error detection
- **Prettier:** Consistent code formatting
- **Configuration:** Standardized rules for maintainability

### Testing Framework
**Vitest + Playwright**
- **Vitest:** Fast unit and integration testing
- **Playwright:** End-to-end browser testing
- **Coverage:** Code coverage reporting

### Version Control
**Git + GitHub**
- **Strategy:** Feature branches with pull requests
- **CI/CD:** GitHub Actions for automated testing
- **Deployment:** Automatic deployment on main branch

## Deployment & Hosting

### Static Hosting
**Netlify (Primary Choice)**
- **Why:** Excellent developer experience, automatic deployments
- **Features:** Form handling, environment variables, custom domains
- **Performance:** Global CDN, automatic HTTPS

**Alternative: Vercel**
- **Benefits:** Similar features, good performance
- **Use Case:** Backup option or preference-based choice

### Domain & DNS
**Custom Domain**
- **Format:** linesheet.giltyboy.com or similar
- **SSL:** Automatic HTTPS via hosting provider
- **Performance:** CDN edge locations for fast global access

### Environment Management
**Environment Variables**
- **Development:** Local .env files
- **Production:** Hosting platform environment settings
- **Security:** API keys never in source code

## Asset Management

### Fonts
**Google Fonts + Custom Fonts**
- **Google Fonts:** Playfair Display, Inter for web compatibility
- **Custom Fonts:** Brand-specific typography files
- **Format:** WOFF2 for optimal compression and browser support

### Images
**Optimized Asset Pipeline**
- **Formats:** WebP for web, PNG/JPG fallbacks
- **Optimization:** Automatic compression during build
- **Responsive:** Multiple sizes for different use cases

### Icons
**Lucide Icons + Custom SVG**
- **Library:** Lucide for consistent iconography
- **Custom:** Brand-specific icons as inline SVG
- **Optimization:** SVG sprites for performance

## Performance Strategy

### Loading Performance
**Code Splitting**
- **Templates:** Lazy load template files
- **Utilities:** Dynamic imports for heavy libraries
- **Assets:** Progressive image loading

**Bundle Optimization**
- **Tree Shaking:** Remove unused code
- **Minification:** Compressed production builds
- **Caching:** Browser cache optimization

### Runtime Performance
**Efficient DOM Updates**
- **Batched Updates:** Group DOM modifications
- **Event Delegation:** Efficient event handling
- **Memory Management:** Cleanup unused objects

### API Performance
**Request Optimization**
- **Caching:** Store API responses locally
- **Batching:** Combine multiple requests when possible
- **Throttling:** Respect API rate limits

## Security Implementation

### API Security
**Environment Variables**
```bash
# Never commit these to version control
AIRTABLE_API_KEY=keyXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXX
```

**Request Validation**
- **Input Sanitization:** Clean all user inputs
- **HTTPS Only:** All API calls over secure connections
- **Error Handling:** Don't expose sensitive information

### Data Protection
**Local Storage Security**
- **No Sensitive Data:** Never store API keys locally
- **Session Management:** Clear data on session end
- **Encryption:** Encrypt sensitive local data if needed

## Monitoring & Analytics

### Error Tracking
**Console Logging + Error Boundaries**
- **Development:** Comprehensive console logging
- **Production:** Error capture and reporting
- **User Feedback:** Clear error messages for users

### Performance Monitoring
**Browser DevTools + Lighthouse**
- **Development:** Regular performance audits
- **Metrics:** Core Web Vitals tracking
- **Optimization:** Continuous performance improvements

## Technology Decisions Rationale

### Why Vanilla JavaScript?
1. **Learning:** Easier for single developer to maintain
2. **Performance:** No framework overhead
3. **Simplicity:** Direct control over all functionality
4. **Future-Proof:** Easy to migrate to React later if needed

### Why Puppeteer for PDF?
1. **Quality:** Best-in-class PDF output
2. **CSS Support:** Full modern CSS compatibility
3. **Consistency:** Matches browser rendering exactly
4. **Professional:** Print-ready output quality

### Why Tailwind CSS?
1. **Speed:** Rapid UI development
2. **Consistency:** Design system built-in
3. **Customization:** Easy brand customization
4. **Print Support:** Excellent print styling capabilities

### Why Airtable?
1. **User-Friendly:** Non-technical users can manage data
2. **API Quality:** Reliable, well-documented API
3. **Flexibility:** Easy to modify data structure
4. **Images:** Built-in image hosting and management

## Future Considerations

### Scalability Options
- **Framework Migration:** React for complex UI needs
- **Backend API:** Node.js server for advanced features
- **Database:** PostgreSQL for complex relationships
- **Authentication:** User management system

### Performance Enhancements
- **Service Workers:** Offline functionality
- **WebAssembly:** Heavy computation optimization
- **Streaming:** Large dataset handling
- **Caching Layer:** Redis for API caching

This technical stack balances simplicity with power, providing a solid foundation for the MVP while maintaining clear upgrade paths for future enhancements.
