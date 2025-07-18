# Deployment Test Checklist

## Pre-Deployment Checks ✅

- [x] **Simple index.html** at root level
- [x] **Python API function** at `api/hello.py`
- [x] **Minimal vercel.json** configuration
- [x] **Simple package.json** without complex dependencies
- [x] **Python file syntax** is correct (no imports, no external dependencies)
- [x] **.gitignore** file present

## Files Structure ✅

```
paramex_psi/                 # Root directory
├── api/
│   └── hello.py            # ✅ Simple Python function
├── index.html              # ✅ Static test page
├── vercel.json            # ✅ Minimal config
├── package.json           # ✅ Minimal config
├── README.md              # ✅ Documentation
└── .gitignore             # ✅ Git ignore rules
```

## Deployment Commands

```bash
# 1. Add all files
git add .

# 2. Commit changes
git commit -m "Simplified deployment - static site with Python API"

# 3. Push to GitHub
git push origin main
```

## After Deployment Tests

### Test 1: Static Site
- [ ] Visit `https://your-app.vercel.app`
- [ ] Should see "🚀 Flowtica Deployment Test" page
- [ ] Page should load without errors

### Test 2: API Function
- [ ] Click "Test API Function" button
- [ ] Should see "✅ API Test Successful!" message
- [ ] Should show JSON response from Python function

### Test 3: Direct API Call
```bash
curl https://your-app.vercel.app/api/hello
```
- [ ] Should return JSON: `{"message": "Hello from Vercel Python!", "status": "working"}`

## Troubleshooting

If deployment still fails:

1. **Check Vercel Logs**:
   - Go to Vercel dashboard
   - Click on your project
   - Check "Functions" tab for errors

2. **Verify Python Function**:
   - Check that `api/hello.py` is in the repository
   - Verify the function syntax is correct
   - No external dependencies required

3. **Test Locally**:
   - Open `index.html` in browser
   - API test will fail locally (expected)
   - But page should load properly

## Success Criteria

✅ **Deployment succeeds**
✅ **Static site loads**
✅ **API function responds**
✅ **No build errors**
✅ **Test page works**

## Next Steps After Success

1. Add more API endpoints
2. Integrate React frontend from `psi_paramex/` directory
3. Add AI functionality
4. Connect to Supabase database
5. Deploy the full application 