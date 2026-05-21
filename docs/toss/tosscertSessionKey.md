---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertSessionKey.md
---
# 세션키 생성

본인 인증 연동시 필요한 세션키를 발급하는 방법을 설명해요.\
보안을 위해 세션키(sessionKey)는 매 요청마다 새로 생성하세요.

:::code-group

```java
public static String generateSessionKey(String sessionId, String secretKey, String iv, String base64PublicKey) throws Exception {
    String sessionAesKey = "AES_GCM$" + secretKey + "$" + iv;
    String encryptedSessionAesKey = encryptSessionAesKey(base64PublicKey, sessionAesKey);
    return "v1$" + sessionId + "$" + encryptedSessionAesKey;
}

```

```javascript
generateSessionKey: function (sessionId, secretKey, iv, base64PublicKey) {
    let sessionAesKey = 'AES_GCM$' + secretKey + '$' + iv
    let encryptedSessionAesKey = this.encryptSessionAesKey(base64PublicKey, sessionAesKey)
    return 'v1$' + sessionId + '$' + encryptedSessionAesKey
},
```

```csharp
public static string GenerateSessionKey(string sessionId, string secretKey, string iv, string base64PublicKey)
{
    string sessionAesKey = "AES_GCM$" + secretKey + "$" + iv;
    string encryptedSessionAesKey = EncryptSessionAesKey(base64PublicKey, sessionAesKey);
    return "v1$" + sessionId + "$" + encryptedSessionAesKey;
}

```

```php
function generateSessionKey(string $sessionId, string $secretKey, string $iv, string $base64PublicKey): string
{
    $sessionAesKey = "AES_GCM$" . $secretKey . "$" . $iv;
    $encryptedSessionAesKey = encryptSessionAesKey($base64PublicKey, $sessionAesKey);
    return "v1$" . $sessionId . "$" . $encryptedSessionAesKey;
}
```

```python
def generate_session_key(session_id, secret_key, iv, base64_public_key):
    session_aes_key = 'AES_GCM$' + secret_key + '$' + iv
    encrypted_session_aes_key = encrypt_session_aes_key(base64_public_key, session_aes_key)
    return 'v1$' + session_id + '$' + encrypted_session_aes_key

```

```ruby
def generate_session_key(session_id, secret_key, iv, base64_public_key)
  session_aes_key = 'AES_GCM$' + secret_key + '$' + iv
  encrypted_session_aes_key = encrypt_session_aes_key(base64_public_key, session_aes_key)
  'v1$' + session_id + '$' + encrypted_session_aes_key
end
```

:::

보다 자세한 예시는 [여기](https://github.com/toss/toss-cert-examples)에서 확인해보세요.
