# Flowtica - Simplified Deployment Test

This is a simplified version of the Flowtica project designed to test Vercel deployment.

## Structure

```
paramex_psi/
├── api/
│   └── hello.py          # Simple Python API function
├── index.html            # Static test page
├── vercel.json          # Vercel configuration
├── package.json         # Minimal package configuration
└── README.md            # This file
```

## Features

- **Static HTML page** with API testing interface
- **Python API function** at `/api/hello`
- **Minimal configuration** for reliable deployment

## Testing

1. **Local Development**:
   - Open `index.html` in a browser
   - Click "Test API Function" button

2. **After Vercel Deployment**:
   - Visit your Vercel URL
   - Click "Test API Function" button
   - Should see successful API response

## API Endpoints

- `GET /api/hello` - Returns a simple JSON response

## Deployment

1. Push to GitHub
2. Vercel automatically deploys
3. Test the deployed site

## Troubleshooting

If deployment fails:
1. Check Vercel function logs
2. Verify Python function syntax
3. Test API endpoint manually
4. Check vercel.json configuration

## Next Steps

Once this simplified version works:
1. Add more API endpoints
2. Integrate with React frontend
3. Add AI functionality
4. Connect to Supabase database 