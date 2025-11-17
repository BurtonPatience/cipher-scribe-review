# Cipher Scribe Configuration Guide

## Environment Variables

### Contract Configuration
```bash
# Contract Address (update after deployment)
VITE_CIPHER_SCRIBE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

### Wallet Configuration
```bash
# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Network Configuration
```bash
# Supported chain IDs
VITE_SUPPORTED_CHAIN_IDS=31337,11155111,137
VITE_DEFAULT_CHAIN_ID=31337
```

### FHEVM Configuration
```bash
# Enable FHEVM operations
VITE_FHEVM_ENABLED=true
VITE_FHE_SECURITY_BITS=128
VITE_MAX_REVIEW_BATCH_SIZE=5
```

### Application Settings
```bash
VITE_APP_NAME=Cipher Scribe
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Privacy-preserving peer review platform
```

### Review System Configuration
```bash
# Minimum reputation required to review
VITE_MIN_REVIEWER_REPUTATION=10
# Maximum reviews allowed per paper
VITE_MAX_REVIEWS_PER_PAPER=10
# Review deadline in days
VITE_REVIEW_DEADLINE_DAYS=30
```

### Performance Settings
```bash
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_CACHE_TIMEOUT_MINUTES=30
```

### Security Settings
```bash
VITE_ENCRYPTION_ENABLED=true
VITE_SESSION_TIMEOUT_MINUTES=60
```

## Network Support

### Local Development
- **Chain ID**: 31337
- **RPC URL**: http://127.0.0.1:8545
- **Features**: Full FHEVM mock support

### Sepolia Testnet
- **Chain ID**: 11155111
- **Features**: Production FHEVM operations
- **Gas Price**: 20 gwei (optimized for FHE)

### Polygon Mainnet
- **Chain ID**: 137
- **Features**: Multi-chain deployment support
- **Gas Price**: 40 gwei (optimized for Polygon)

## Deployment Checklist

### Pre-deployment
- [ ] Set contract address in environment variables
- [ ] Configure WalletConnect project ID
- [ ] Test FHEVM operations on target network
- [ ] Verify gas limits and pricing
- [ ] Set up monitoring and alerting

### Post-deployment
- [ ] Verify contract functionality
- [ ] Test reviewer onboarding flow
- [ ] Validate paper submission process
- [ ] Check review encryption/decryption
- [ ] Monitor gas usage and performance

## Security Considerations

### FHEVM Security
- Always verify proof generation
- Implement proper input validation
- Monitor gas usage for DoS protection
- Use emergency stop functionality when needed

### Access Control
- Require minimum reputation for reviews
- Implement approval workflow for reviewers
- Use time-locked operations for critical functions
- Enable multi-signature controls for admin functions

### Data Privacy
- Never store decrypted review data
- Implement proper anonymization
- Use secure random generation for IDs
- Regularly audit data handling practices

## Performance Optimization

### Gas Optimization
- Use unchecked arithmetic for counters
- Cache frequently accessed storage variables
- Implement batched operations where possible
- Monitor and optimize FHE operation costs

### Frontend Performance
- Implement lazy loading for large datasets
- Use caching for repeated API calls
- Optimize bundle size with code splitting
- Monitor Core Web Vitals

### Database/Indexing
- Implement efficient paper search
- Use proper indexing for reviewer data
- Cache frequently accessed statistics
- Implement pagination for large datasets
