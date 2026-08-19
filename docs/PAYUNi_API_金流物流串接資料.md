# PAYUNi API 金流／物流串接資料（Next.js 整合用）

> 來源: https://docs.payuni.com.tw/web/#/7/
> 本文件完整保留所有「金流支付方式」與「物流方式」相關 API 說明、請求/回傳參數、加解密範例程式碼；其餘（SDK、購物車模組、修改記錄、錯誤代碼、銀行/超商代碼）已簡化為摘要或連結。

## 目錄

- 說明與加解密基礎
  - [說明](#24)
  - [交易測試資料說明](#374)
  - [資料加密陣列](#56)
  - [PHP範例](#29)
  - [Node.js範例](#312)
  - [Java範例](#343)
- 交易建立 - 各金流支付方式 API
  - [整合式支付頁 UNiPaypage (UPP)](#34)
  - [虛擬帳號幕後(ATM)](#36)
  - [虛擬帳號幕後(ATM)](#37)
  - [超商代碼幕後(CVS)](#326)
  - [LINE Pay幕後](#350)
  - [AFTEE幕後](#386)
  - [街口支付幕後(JKoPay)](#511)
  - [免跳轉元件(UNi Embed)](#512)
  - [免跳轉支付元件(UNi Embed)](#513)
  - [免跳轉支付元件(UNi Embed)](#522)
- 交易查詢 API
  - [信用卡幕後Token交易(CREDIT)](#164)
  - [交易查詢](#172)
- 信用卡相關操作 API (請退款/取消授權/Token查詢取消/分段請求)
  - [多筆交易查詢](#38)
  - [交易請退款(CREDIT)](#39)
  - [交易取消授權(CREDIT)](#40)
  - [信用卡Token查詢(約定)(CREDIT)](#41)
  - [信用卡Token取消(約定/記憶卡號)(CREDIT)](#100)
- 交易確認/取消/退款 API (各支付工具)
  - [分段請求](#85)
  - [後支付確認(AFTEE)](#333)
  - [交易取消超商代碼(CVS)](#72)
  - [愛金卡退款(ICASH)](#84)
  - [後支付退款(AFTEE)](#300)
  - [LINE Pay退款](#377)
- 非信用卡退款轉匯 API
  - [街口支付退款](#76)
  - [非信用卡退款轉匯(請求交易)](#77)
  - [非信用卡退款轉匯取消](#381)
- 撥款提領查詢 API
  - [非信用卡退款轉匯(請求頁面)](#219)
  - [提領查詢](#231)
- 物流工具 API (7-ELEVEN 超商 / 黑貓宅配)
  - [物流單修改(背景)](#129)
  - [物流單查詢](#124)
  - [建立超商物流單](#122)
  - [超商門市地圖(前景)](#103)
  - [超商出貨單列印(前景)](#123)
  - [退貨便要號](#125)
  - [店到店物流單轉宅配資料提供](#304)
  - [建立宅配單(背景)](#268)
  - [產宅配編號並下載託運單PDF檔(前景)](#269)
  - [下載託運單PDF檔(前景)](#270)
  - [呼叫黑貓(背景)](#271)
  - [建立宅配退貨單(背景)](#272)
- 續期收款 API
  - [續期收款-支付頁](#305)
  - [續期收款幕後](#329)
  - [續期收款狀態修改](#311)
  - [續期收款訂單內容修改](#316)
  - [續期收款訂單查詢](#320)
  - [續期收款卡號修改-幕後](#330)
  - [續期收款卡號修改-支付頁](#331)
- 優惠券 API
  - [優惠券使用查詢](#391)
  - [優惠券全額折抵幕後 API](#392)
- Notify 背景通知 API (各支付/物流/續期/優惠券)
  - [整合式支付頁 UNiPaypage (UPP)](#80)
  - [一頁收款 UNiOnepage (UOP) NOTIFY](#53)
  - [虛擬帳號付款通知(ATM Notify)](#73)
  - [超商代碼付款通知(CVS Notify)](#74)
  - [訂單付款期限到期通知](#75)
  - [超商物流貨態通知 NOTIFY](#291)
  - [宅配貨態通知](#274)
  - [續期收款-每期授權完成通知](#306)
  - [訂單電子發票開立結果通知](#344)
  - [優惠券發放通知](#390)
  - [免跳轉支付元件 3D 交易結果 Notify](#514)
  - [LINE Pay 幕後 Notify](#520)
  - [街口支付幕後 Notify](#521)
  - 簡化摘要：SDK / 購物車模組 / 修改記錄 / 錯誤代碼 / 銀行超商代碼

---


# 說明與加解密基礎


## <a id="24"></a>說明 (7/24)

```
統一金流 PAYUNi




服務介紹

統一金流 PAYUNi 提供金流代收服務，整合所有支付方式，並提供完整後台功能操作便利直覺。
營業人無須向銀行申請，直接可透過平台讓商店能夠以最快速的串接方式，滿足消費者各種支付方式的需求。

信用卡
提供 VISA、MasterCard、JCB、銀聯卡 信用卡收款服務，包含一次付清、分期付款 服務。

超商代碼
提供統一超商全台約7000間門市付款櫃台，消費者可至超商多媒體機台輸入代碼列印繳費單至超商櫃檯繳費。

ATM 轉帳
提供 ATM 虛擬帳號轉帳服務，可透過銀行自動櫃員機付款或是網銀及銀行APP轉帳

icash Pay
提供 icash Pay 收款服務，消費者可透過icash Pay APP電子錢包進行繳費。

LINE Pay
提供 LINE Pay收款服務，消費者可綁定信用卡或簽帳金融卡，搭配 LINE Points 進行付款。

街口支付
提供街口支付收款服務，消費者可綁定帳戶、信用卡，搭配街口幣、官方街口券或店家街口券進行付款。

AFTEE先享後付
提供AFTEE收款服務，只要手機號碼就能進行付款，不需下載APP，不綁定信用卡、帳戶，不跳轉網頁，實現一鍵即買結帳模式。

物流服務
提供物流整合所有支付方式服務、建立正逆物流訂單功能所需之串接金鑰、物流服務API介接規格。

7-ELEVEN超商(B2C大宗寄倉)
提供7-ELEVEN超商大宗寄倉冷凍及常溫物流服務，消費者可選擇超商取貨付款或門市純取貨服務。

7-ELEVEN超商(C2C店到店)
提供7-ELEVEN超商店到店冷凍及常溫物流服務，消費者可選擇超商取貨付款或門市純取貨服務。

7-ELEVEN超商(C2B退貨便：需完成大宗寄倉常溫開通)
提供7-ELEVEN超商退貨便物流服務，讓消費者至7-ELEVEN ibon取得退貨單將貨品寄回物流中心。

黑貓宅配
提供黑貓宅配送貨到府的常溫、冷凍及冷藏物流服務，消費者可選擇宅配貨到付款或純收件服務。

黑貓退貨
提供黑貓退貨至指定地址收取退件的物流服務(支援常溫、冷凍、冷藏)，退貨包裹可直接寄回商店指定地址。

電子發票
提供光貿電子發票功能，商店於PAYUNi後台完成電子發票設定後，每筆交易付款完成時，系統將依設定自動或手動開立發票。
- 電子發票功能不支援舊版API(如1.0、1.1)，請使用最新版本以確保功能正常運作。

優惠券
提供優惠券行銷工具，商店於PAYUNi後台完成優惠券功能開通，即可依據行銷活動設定折扣優惠券。



客服電話：02-6605-0810 客服信箱：service@payuni.com.tw
https://www.payuni.com.tw/
```


## <a id="374"></a>交易測試資料說明 (7/374)

```
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
一次付清(模擬3D交易ECI值不符主動取消授權)：4147631000000002，3560511000000002
分期付款：4147632000000001(不支援9期)，4741502000000001
銀聯卡：6200000000000001
卡片到期日及背面末三碼可任意填入
Apple Pay、Google Pay、Samsung Pay不限卡號於測試區皆為模擬成功
測試區ATM轉帳、超商代碼繳費付款完成測試
如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
測試區 LINE PAY 測試資料
測試區收款：申請LINE Pay時的Channel ID與 Channel Secret Key可填隨意數字
測試區付款：於LINE Pay完成綁定信用卡後即可於測試區付款(請於App Store或Google Play下載及安裝LINE Pay)
不限卡號於測試區皆為模擬成功
測試區 AFTEE 測試資料
測試模式中僅接受下述電話號碼
消費者非AFTEE會員：0909999981
消費者是AFTEE會員：0909999991 密碼：Password1234
```


## <a id="56"></a>資料加密陣列 (7/56)

```

```


## <a id="29"></a>PHP範例 (7/29)

```
簡要描述
PHP Aes 加解密範例
建議PHP版本需為7.1.0以上
加密 Function
function Encrypt(array $data = [], string $merKey = "", string $merIV = "")
{
    $tag = ""; //預設為空
    $encrypted = openssl_encrypt(http_build_query($data), "aes-256-gcm", trim($merKey), 0, trim($merIV), $tag);
    return trim(bin2hex($encrypted . ":::" . base64_encode($tag)));
}

解密 Function
function Decrypt(string $encryptStr = "", string $merKey = "", string $merIV = "")
{
    list($encryptData, $tag) = explode(":::", hex2bin($encryptStr), 2);
    return openssl_decrypt($encryptData, "aes-256-gcm", trim($merKey), 0, trim($merIV), base64_decode($tag));
}

Hash Function
$merKey="12345678901234567890123456789012";
$merIV="1234567890123456";
$encryptStr="加密後字串(可參考範例)";
strtoupper(hash("sha256", "$merKey$encryptStr$merIV"));

加解密 Key (範例)
AesKey="12345678901234567890123456789012";
AesIV="1234567890123456";

加密範例
<?php
//  加密資料
$encryptArr = [
    "MerID" => "AAA",
    "MerTradeNo" => "BBB",
];
//  KeyIV
$merKey = "12345678901234567890123456789012";
$merIV  = "1234567890123456";
//  加密字串
$encryptStr = Encrypt($encryptArr, $merKey, $merIV);
//  結果 47396636346f66735853533167396942344f587a3775696b34752b596e70452b3a3a3a4373354a5a5143306b7153467531354c6e6f554a69773d3d
print_r($encryptStr);
?>

解密範例
<?php
//  KeyIV
$merKey = "12345678901234567890123456789012";
$merIV  = "1234567890123456";
//  加密字串
$encryptStr ="47396636346f66735853533167396942344f587a3775696b34752b596e70452b3a3a3a4373354a5a5143306b7153467531354c6e6f554a69773d3d";
//  結果 MerID=AAA&MerTradeNo=BBB
$decryptArr = Decrypt($encryptStr, $merKey, $merIV);
print_r($decryptArr);
?>

```


## <a id="312"></a>Node.js範例 (7/312)

```
簡要描述

Node.js 版本加解密範例以及執行範例

加解密範例
需載入 Node.js 加密模組
const crypto = require("crypto");

AES-GCM 加密範例
/**
 * @param {string} plaintext - 要加密的參數
 * @param {string} key - 加密 Key
 * @param {Buffer} iv - 初始化向量 iv
 * @returns {Buffer} - 加密結果
 */

function encrypt(plaintext, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-gcm",key, iv);

  let cipherText = cipher.update(plaintext, "utf8", "base64");
  cipherText += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");
  return Buffer.from(`${cipherText}:::${tag}`).toString("hex").trim();

}

AES-GCM 解密
/**
 * @param {string} encryptStr - 要解密的參數
 * @param {string} key - 加密 Key
 * @param {Buffer} iv - 初始化向量 iv
 * @returns {string} - 解密結果
 */

function decrypt(encryptStr, key, iv) {
  const [encryptData, tag] = Buffer.from(encryptStr, "hex").toString().split(":::");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let decipherText = decipher.update(encryptData, "base64", "utf8");
  decipherText += decipher.final("utf8");

  return decipherText;
}

SHA256 加密
/**
 * @param {string} encryptStr - 加密過後的參數
 * @param {string} key - 加密 Key
 * @param {Buffer} iv - 初始化向量 iv
 * @returns {string} - hash 結果的字串，16進制且皆為大寫
 */
function sha256 (encryptStr, key, iv) {
  const hash = crypto.createHash("sha256").update(`${key}${encryptStr}${iv}`);
  return hash.digest("hex").toUpperCase();
}

執行範例
模擬商店資料
const merData = {
  MerID: "AAA",
  MerTradeNO: "BBB",
  Prod: "商品說明"
}

將字串轉成 Query String
const querystring = require("querystring");
const plaintext = querystring.stringify(merData);
const merKey = "12345678901234567890123456789012"

AES-GCM 傳入的 iv 必須為 Buffer 格式
const merIv = Buffer.from("1234567890123456");

執行加解密以及 SHA256
const getEncrypt = encrypt(plaintext, merKey, merIv)
const getDecrypt = decrypt(getEncrypt, merKey, merIv)
const getSha256 = sha256(getEncrypt, merKey, merIv)

使用相同模擬商店資料應可得
// AES-GCM 加密結果
47396636346f66735853533167396942344f587a3775696b34732b596e70452b675270564f73536b7753446c6a4d77526d4e374256514173672b6c78616d4533504d475152642b362f4530626f446e4f6356533969756c743a3a3a4b5961342f4635456965743069385a784b6277704a413d3d

// AES-GSM 解密結果
MerID=AAA&MerTradeNO=BBB&Prod=%E5%95%86%E5%93%81%E8%AA%AA%E6%98%8E

// SHA256 
E97180D78C8378D64A188D292938B9D2717034F292B626019B01DF160AEFC0B7

```


## <a id="343"></a>Java範例 (7/343)

```
簡要描述
Java加解密範例
加解密範例
public class PayUniExample {
    public static void main(String[] args) {
        String hashKey = "12345678901234567890123456789012";
        String hashIV = "1234567890123456";
        String encrypt = "MerID=ABC&MerTradeNo=1658198662_93966&TradeAmt=7017&Timestamp=1658198662&ProdDesc=%E5%95%86%E5%93%81%E8%AA%AA%E6%98%8E&UsrMail=a%40presco.ws&ReturnURL=http%3A%2F%2Flapi-epay.presco.com.tw%2Fapi%2Fupp%2Freturn";
        // 加密
        String encryptData = Encrypt(encrypt, hashKey, hashIV);
        System.out.println("EncryptInfo:" + encryptData + "\r\n");
        // EncryptInfo:47396636346f66735853653367396942344f587a3775696b34752b593765564a6e337365625a6176316a72706d7377536938436a41695239773545764f3251784b6257665273715374476b70385232564a4643306d655151764855616c7a7a45764c4b4e5462654c574a536553346d527572413357794379324f59555466494a5977344b6f50432f72733564723853546a516d44396c4744672b5a7132696967337345664e4b6f625759637579737a47715767706d6e76786f3773693139534165485374612b673343594a4e65744a4d6b396b6f6b304c6b716d2f596e64494e4863456f35655a693833494f346b4f307679733346695a48734751454b386a4453494c613955556661774234697770506752306e70673d3d3a3a3a50724e743974526e6332704775547a7a7362494a33413d3d

        // 取hash
        String hashData = GetHash(encryptData, hashKey, hashIV);
        System.out.println("HashData:" + hashData + "\r\n");
        // HashData:5CED70BDE1027F5DB2512C6B0957D698DADA0DBB67F3051C19A0F48C7455E249

        // 解密
        String decryptData = Decrypt(encryptData, hashKey, hashIV);
        System.out.println("DecryptInfo:" + decryptData + "\r\n");
        // DecryptInfo:MerID=ABC&MerTradeNo=1658198662_93966&TradeAmt=7017&Timestamp=1658198662&ProdDesc=%E5%95%86%E5%93%81%E8%AA%AA%E6%98%8E&UsrMail=a%40presco.ws&ReturnURL=http%3A%2F%2Flapi-epay.presco.com.tw%2Fapi%2Fupp%2Freturn
    }

    // 加密
    public static String Encrypt(String text, String key, String iv) {
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "AES");
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv.getBytes(StandardCharsets.UTF_8));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(1, secretKeySpec, gcmParameterSpec);
            byte[] encryptedBytes = cipher.doFinal(text.getBytes(StandardCharsets.UTF_8));
            byte[] encryptedInfo = Arrays.copyOfRange(encryptedBytes, 0, encryptedBytes.length - 16);
            byte[] tagInfo = Arrays.copyOfRange(encryptedBytes, encryptedBytes.length - 16, encryptedBytes.length);
            String encodeText = Base64.getEncoder().encodeToString(encryptedInfo);
            String encodeTag = Base64.getEncoder().encodeToString(tagInfo);
            String finalString = encodeText + ":::" + encodeTag;
            byte[] finalBytes = finalString.getBytes(StandardCharsets.UTF_8);
            return bytesToHex(finalBytes);
        } catch (Exception var13) {
            var13.printStackTrace();
            return null;
        }
    }

    // 解密
    public static String Decrypt(String text, String key, String iv) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "AES");
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv.getBytes(StandardCharsets.UTF_8));
            cipher.init(2, secretKeySpec, gcmParameterSpec);
            byte[] hexToByte = hexStringToByteArray(text);
            String encryptStr = new String(hexToByte, StandardCharsets.UTF_8);
            String encryptInfo = encryptStr.split(":::")[0];
            byte[] encryptInfoBytes = Base64.getDecoder().decode(encryptInfo);
            String tagString = encryptStr.split(":::")[1];
            byte[] tagStringBytes = Base64.getDecoder().decode(tagString);
            byte[] encryptData = new byte[encryptInfoBytes.length + tagStringBytes.length];
            System.arraycopy(encryptInfoBytes, 0, encryptData, 0, encryptInfoBytes.length);
            System.arraycopy(tagStringBytes, 0, encryptData, encryptInfoBytes.length, tagStringBytes.length);
            byte[] decodeInfo = cipher.doFinal(encryptData);
            String decodeInfoString = new String(decodeInfo, StandardCharsets.UTF_8);
            return decodeInfoString;
        } catch (Exception var15) {
            var15.printStackTrace();
            return null;
        }
    }

    private static byte[] hexStringToByteArray(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];

        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4) + Character.digit(hex.charAt(i + 1), 16));
        }

        return data;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        byte[] var5 = bytes;
        int var4 = bytes.length;

        for (int var3 = 0; var3 < var4; ++var3) {
            byte b = var5[var3];
            sb.append(String.format("%02x", b));
        }

        return sb.toString();
    }

    // 取得hash
    public static String GetHash(String data, String key, String iv) {
        String sha256 = encrySha256(key + data + iv);
        return sha256.trim();
    }

    private static String encrySha256(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            messageDigest.update(value.getBytes());
            byte[] byteBuffer = messageDigest.digest();
            StringBuffer strHexString = new StringBuffer();

            for (int i = 0; i < byteBuffer.length; ++i) {
                String hex = Integer.toHexString(255 & byteBuffer[i]);
                if (hex.length() == 1) {
                    strHexString.append(&#039;0&#039;);
                }

                strHexString.append(hex);
            }

            return strHexString.toString().toUpperCase();
        } catch (Exception var6) {
            return null;
        }
    }
}

```


# 交易建立 - 各金流支付方式 API


## <a id="34"></a>整合式支付頁 UNiPaypage (UPP) (7/34)

```
整合式支付頁 UNiPaypage (UPP)
簡要描述

PAYUNi平台提供金流代收服務並整合所有支付方式，會員可透過平台以最快速的串接方式，滿足消費者各種支付方式的需求。

本文件主要說明整合式支付串接方式，與各種支付交易流程，支付頁面採RWD設計，能讓消費者在不同設備的瀏覽器上，呈現最佳的瀏覽支付頁面，提供消費者多元的支付選擇。

串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
信用卡	支援卡別：Visa、MasterCard、JCB、銀聯
一次付清：包含國內卡、國外卡
分期付款：包含3期、6期、9期、12期、18期、24期、30期 (各銀行支援期數)
Apple Pay：包含國內卡、國外卡(不支援銀聯)
Google Pay™：包含國內卡、國外卡(不支援銀聯)
Samsung Pay：包含國內卡、國外卡(不支援銀聯與JCB)

信用卡記憶卡號	可提供持卡人在付款時選擇是否記憶卡號，以利下次支付時於結帳頁面自動帶出卡號
信用卡Token	1.於首次交易時持卡人可與商店約定，進行信用卡Token交易，爾後商店只需使用該信用卡Token，即可以幕後方式進行該約定之授權交易
2.此功能可達到自訂排程，不定期不定額授權交易
3.需向PAYUNi平台申請審核開通且綁定IP
4.需申請信用卡Token功能(申請書下載)
5.後續信用卡Token交易請參考信用卡幕後Token交易
超商代碼繳費	可持超商代碼至全台統一超商，使用多媒體事務機列印繳費單臨櫃付款
ATM轉帳	1.僅支援單繳帳號(一次性虛擬帳號)
icash Pay	1. 提供至icash Pay進行繳款。
2. 需透過PAYUNi平台申請審核開通帳號。
AFTEE先享後付	1. 提供至AFTEE進行繳款。
2. 需透過PAYUNi平台申請審核開通帳號。
LINE Pay	1. 提供至LINE Pay進行繳款。
2. 需至LINE Pay平台申請取得ID與KEY。
3. 若有開啟i PASS MONEY 服務，可由消費者選擇後進行繳款。
街口支付	1. 提供至街口支付進行繳款。
2. 需透過PAYUNi平台申請審核開通帳號。
貨到付款	1. 提供至7-ELEVEN門市進行取貨付款。
2. 需透過PAYUNi平台申請物流審核開通帳號。
宅配貨到付款	1. 提供黑貓宅配送貨到府時進行付款。
2. 需透過PAYUNi平台申請物流審核開通帳號。
信用卡交易流程

首次信用卡Token交易(3D)

後續信用卡Token交易請參考信用卡幕後Token交易
首次信用卡Token交易(非3D)

後續信用卡Token交易請參考信用卡幕後Token交易
首次買方Token交易(3D)

首次買方Token交易(非3D)

超商代碼交易流程

ATM轉帳交易流程

icashPay交易流程
付款人(消費者)需自行開啟icash Pay APP進行掃描條碼進行付款。
付款結果(包含成功、失敗)將由icashPay傳送交易結果給統一金流。

AFTEE 先享後付交易流程
跳出AFTEE手機驗證視窗，進行簡訊驗證之後，即可完成結帳手續。
付款人(消費者)結帳手續完成當下不需繳費，商家向付款人(消費者)請款或商品出貨後，會收到繳費通知簡訊，APP會員則可登入APP確認訂單狀態。
付款人(消費者)使用繳費通知簡訊或AFTEE APP於四大超商・ATM/網銀進行付款。

LINE Pay交易流程
付款人(消費者)需自行登入或開啟LINE Pay APP進行掃描條碼進行付款。
付款結果(包含成功、失敗)將由LINE Pay傳送交易結果給統一金流。

Google Pay™交易流程
請參閱 Google Pay 網頁版開發人員說明文件、Google Pay 網頁版整合檢查清單 以及 Google Pay 網頁版品牌宣傳指南。
請遵守《Google Pay API 使用限制政策》，並接受《Google Pay API 服務條款》中訂定的條款。

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/upp

正式區：https://api.payuni.com.tw/api/upp

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Form Post
使用HTML的<form>元素提交數據
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
一次付清(模擬3D交易ECI值不符主動取消授權)：4147631000000002，3560511000000002
分期付款：4147632000000001(不支援9期)，3560512000000001(不支援9期)
銀聯卡：6200000000000001
卡片到期日及背面末三碼可任意填入
Apple Pay、Google Pay、Samsung Pay不限卡號於測試區皆為模擬成功
LINE Pay：Channel ID與 Channel Secret Key可填隨意數字
測試區ATM轉帳、超商代碼繳費付款完成測試
如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
測試區 DeepLinkURL 測試注意事項：
為避免混淆測試結果，測試環境將自動忽略 DeepLinkURL 欄位，視為空值處理。
若於測試環境提供 DeepLinkURL 欄位，因該欄位將被略過，請務必同時提供 ReturnURL，系統將改由 ReturnURL 導回交易結果頁面，以確保能正常查看交易結果。
請求參數
Y=必要；C=選填
若未帶任何支付工具參數，則依據後台之開啟項目決定付款頁面啟用項目
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	需與EncryptInfo中MerID參數值一致　　
Version	Y	string	版本	固定 2.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考 訂單金額限制說明　　
Timestamp	Y	int	時間戳記	格式: time()
ReturnURL	C	string	前景通知網址
付款完成返回指定網址(Form Post)
若空值，付款後呈現PAYUNi付款結果頁或取號完成頁面
交易結果請以NotifyURL為主	格式: 完整網址
DeepLinkURL	C	string	可打開特定的應用內容，包含APP、網站等。

測試環境將略過 DeepLinkURL 欄位功能視為空值處理。	格式: 完整網址
此欄位有值時不會觸發ReturnURL
僅限支付工具時生效：icash Pay、LINE Pay、街口支付、AFTEE先享後付
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址	格式: 完整網址
僅限80與443 port
BackURL	C	string	返回商店按鈕網址
PAYUNi付款頁、付款結果頁、取號完成頁面顯示的返回商店按鈕，點擊後返回指定網址	格式: 完整網址
UsrMail	C	string	消費者信箱	格式: 信箱格式
付款頁帶入付款人信箱
若未帶參數則空白
UsrMailFix	C	int	付款頁消費者信箱固定
若無帶入UsrMail參數，則信箱預設可修改	1=不可修改
Cardholder	C	int	啟用信用卡3D交易時需輸入持卡人英文名稱，供發卡行驗證	預設不啟用
1=啟用
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
ExpireDate	C	string	超商代碼或ATM轉帳繳費有效日期
最少值為當日，超商代碼最大值為當日+7天，ATM轉帳最大值為當日+180天
當設定大於當日+7天時，則支付頁不顯示超商代碼支付方式
若設定為當日，請注意訂單成立後至少需有 2 小時的繳費時間，若小於2小時，請設定日期為隔日
如未帶此參數預設為當日+7天	格式: YYYY-MM-DD
AtmBankType	C	string	指定ATM銀行	請帶入指定銀行代碼，以逗號分隔，例：822,004,013
請參考銀行代碼(數字)
若未帶此參數則預設顯示所有可支援的銀行
TradeLExpireSec	C	int	付款頁面交易截止秒數
若未帶此參數則預設為600秒	格式: 60-600
Credit	C	int	信用卡一次付清	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
ICash	C	int	icash Pay支付	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
Aftee	C	int	AFTEE先享後付	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
LinePay	C	int	LINE Pay	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
JKoPay	C	int	街口支付	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
ATM	C	int	虛擬帳號支付	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
CVS	C	int	超商代碼/條碼支付	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
CreditUnionPay	C	int	信用卡(銀聯)支付	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
CreditInst	C	string	信用卡分期支付	可設定多組分期
ex: 3,6,9,12
未帶任何指定支付工具參數，則依平台商店預設值
ApplePay	C	int	Apple Pay	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
GooglePay	C	int	Google Pay™	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
SamsungPay	C	int	Samsung Pay	1=啟用
非必填
未帶任何指定支付工具參數，則依平台商店預設值
API3D	C	int	指定3D	1=指定3D
當商店信用卡3D設定為關閉3D時，可帶入此參數表示此筆交易指定使用3D交易
Union3D	C	int	指定銀聯Unionpay	1=指定銀聯Unionpay
若銀聯卡設定為Expresspay時，帶入此參數則表示此筆交易指定使用Unionpay
Ship	C	int	貨到付款	1=貨到付款
非必填
不啟用則不帶入該參數
使用方式請參考備註說明
TradeInvoice	C	int	電子發票	1=啟用
非必填
未帶任何指定支付工具參數，則不啟用
Lang	C	String	語系	en=英文版 ，zh-tw=中文版
未提供此參數或參數值帶入非設定值，將預設為繁體中文
首次信用卡Token交易請求參數
Y=必要；C=選填
若有需要使用首次信用卡Token交易，在請求參數項目中需帶入以下參數
後續信用卡Token交易請參考信用卡幕後Token交易
參數
(EncryptInfo)	必要	類型	說明	備註
CreditToken	C	string	信用卡Token
付款人綁定資料使用，例：會員編號或Email手機等
如使用 UseTokenType 參數，此為必填	長度限制: 200
格式: [A-Z a-z 0-9 @.#$%_-]
UseTokenType	C	int	信用卡 Token 類型
如使用此參數，CreditToken參數為必填	1=約定信用卡，至付款頁面時消費者可自行取消約定
2=記憶卡號功能，使用此功能，CreditShowType參數可進行設定
3=強制約定信用卡，消費者無法取消
CreditShowType	C	int	信用卡記憶卡號顯示類型
若無帶入此參數，預設為2	1=卡號
2=卡號+到期日
CreditTokenType	C	int	信用卡 Token 紀錄類型
會員:
會員旗下所有商店代號共用此Token
商店:
僅限於首次交易商店代號可使用此Token	1=會員(預設)
2=商店
CreditTokenExpired	C	string	信用卡 Token 有效期間
若未帶此參數，則預設以該信用卡到期日為主	格式: MMYY
買方token交易請求參數
Y=必要；C=選填
若有需要使用「首次買方token」交易，在請求參數項目中需帶入以下參數
參數
(EncryptInfo)	必要	類型	說明	備註
BuyerToken	C	string	綁定買方Token
買方會員綁定資料使用，例：會員編號、Email、手機等，並由買方會員於前景頁面完成登入或註冊後，完成綁定。
如使用 BuyerToken 參數，此為必填	長度限制: 200
格式: [A-Z a-z 0-9 @.#$%_-]
BuyerTokenType	C	int	買方綁定類型(如使用此參數，BuyerToken參數為必填)
會員:
會員旗下所有商店代號皆可使用的買方 Hash
商店:
僅限於首次交易的商店代號可使用的買方 Hash	1=會員(預設)
2=商店
若有需要使用「買方token」交易，在請求參數項目中需帶入以下參數
需先經「首次買方token」交易，取得 BuyerHash值，於後續交易可使用「買方token」交易。
參數
(EncryptInfo)	必要	類型	說明	備註
BuyerHash	C	string	買方會員Token Hash
交易時若入帶入買方 Hash，該筆交易可完成買方驗證並綁定交易於該會員身分上。	BuyerHash 須經由 UPP API首次交易帶入 BuyerToken 且，經由 User 透過 UPP 支付頁，登入並完成交易後即會取得 BuyerHash。
優惠劵服務請求參數
Y=必要；C=選填
若有需要使用優惠券功能時，在請求參數項目中需帶入以下參數
參數
(EncryptInfo)	必要	類型	說明	備註
Coupon	C	int	是否啟用優惠券	1=啟用
非必填
不啟用則不帶入該參數
CouponNotifyURL	C	String	優惠劵發劵背景通知網址
將優惠券通知指定網址	
物流服務請求參數
Y=必要；C=選填
若有需要使用物流服務(預設含取貨不付款及取貨付款)，在請求參數項目中需帶入以下參數
參數
(EncryptInfo)	必要	類型	說明	備註
ShipTag	C	int	是否啟用物流	1=啟用物流(預設含取貨不付款及取貨付款)
非必填
不啟用則不帶入該參數
使用方式請參考備註說明
LgsType	C	String	物流通路	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配
非必填
不啟用物流則不帶入該參數
ShipType	C	int	通路類別	1=7-ELEVEN，2=黑貓宅配
非必填
不啟用物流則不帶入該參數
若物流通路為 B2C 或 C2C 請帶 1，為 HOME 請帶 2
GoodsType	C	int	寄件型態	1=常溫，2=冷凍，3=冷藏
非必填
不啟用物流則不帶入該參數
冷藏僅黑貓宅配支援
Consignee	C	String	取件人姓名	限制長度：10
最長5個中文字、最短至少2個中文字或4個英文字(請填寫真實姓名，超商取件時核對身分使用)
非必填
不啟用物流則不帶入該參數
ConsigneeMobile	C	String	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)
非必填
不啟用物流則不帶入該參數
ConsigneeAddress	C	String	取件人地址	不啟用黑貓物流則不帶入該參數
最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
ConsigneeAddressFix	C	int	付款頁取件人地址固定
若無帶此參數，則收件人地址預設可修改	1=不可修改

備註：
1.)當帶ShipTag=1時，表示啟用物流(預設含取貨不付款及取貨付款)，若有帶支付工具參數時，則依參數設定有帶Ship=1時才有取貨付款。
2.)當帶Ship=1，且未帶ShipTag=1時，僅有取貨付款，無取貨不付款
3.)當有啟用物流時(Ship=1或ShipTag=1)，則需傳遞LgsType、ShipType、GoodsType、Consignee、ConsigneeMobile參數
4.)若沒有帶(Ship=1或ShipTag=1)時，則視為ㄧ般交易，無物流服務，亦不產生物流單
5.)物流參數使用範例：

ShipTag=1
(是否啟用物流))	Ship=1
(取貨付款)	指定支付工具參數	支付頁顯示結果
V			- 取貨付款
- 商店預設支付工具(搭配物流取貨不付款)
V		V	- 指定支付工具(搭配物流取貨不付款)
V	V	V	- 取貨付款
- 指定支付工具(搭配物流取貨不付款)
	V		- 取貨付款
	V	V	- 取貨付款
- 指定支付工具(無物流)
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
Unapproved=訂單待確認，買家會員資格審查中
失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 2.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
UNAPPROVED=訂單待確認，買家會員資格審查中
若失敗請參考錯誤代碼
Message	狀態說明	授權成功=信用卡授權成功
(CVS)建立成功=超商代碼取號成功
(ATM)建立成功=ATM轉帳取號成功
若失敗請參考錯誤代碼
UNKNOWN=系統忙碌中，尚未確認交易結果
當60秒無收到銀行回應會先回覆UNKNOWN，後續若有取得交易結果會Notify至NotifyURL，或建議可於15分鐘後發動交易查詢確認交易狀態
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	0=取號成功
1=已付款
2=付款失敗
3=付款取消
8=訂單待確認
PaymentType	支付工具	1=信用卡
2=ATM轉帳
3=代碼
5=貨到付款(超商取貨付款)
6=愛金卡 (ICash)
7=後支付 (Aftee)
9=LinePay
10=宅配到付
11=JKoPay
Gateway	交易標記	固定2=整合式支付頁 UNiPaypage (UPP)
BuyerHash	買方會員Token Hash	Token 專用返回參數。需在初次交易帶入 BuyerToken ，並由買方登入或註冊買方會員，完成交易後才會取得
信用卡
(PaymentType=1)	說明	備註
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardInst	分期數	　　
FirstAmt	首期金額	　　
EachAmt	每期金額	　　
ResCode	回應碼	　　
ResCodeMsg	回應碼敘述	　　
AuthCode	授權碼	　　
AuthBank	授權銀行(代碼)	　　
AuthBankName	授權銀行(名稱)	　　
AuthType	授權類型	1=一次
2=分期
4=Apple Pay
5=Google Pay
6=Samsung Pay
7=銀聯
AuthDay	授權日期	格式: YYYYMMDD
AuthTime	授權時間	格式: HHIISS
CreditHash	信用卡Token Hash	Token專用返回參數
有 CreditToken 且授權成功才會壓碼
CreditLife	信用卡Token 有效日期	格式: MMYY
CardBank	發卡銀行(代碼)	若為國內發卡行則為銀行代碼(3碼)，若非國內發卡行則為”-“
CoBrandCode	聯名卡代號	聯名卡交易識別代號(需事先設定)
虛擬帳號
(PaymentType=2)	說明	備註
BankType	銀行(代碼)	請參考銀行代碼(數字)
PayNo	繳費虛擬帳號	　　
PaySet	繳費設定	1=一次性

ExpireDate	繳費截止時間	格式: YYYY-MM-DD HH:II:SS
超商代碼
(PaymentType=3)	說明	備註
Store	超商(代碼)	7-ELEVEN
PayNo	繳費代碼	　　
ExpireDate	繳費截止時間	格式: YYYY-MM-DD HH:II:SS
純取貨(ShipTag=1)、
貨到付款(PaymentType=5)	說明	備註
PartnerId	母代碼	LagsType=B2C，長度限制：3
ShipTradeNo	UNi物流序號	　　
GoodsType	寄件型態	1=常溫，2=冷凍
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
ShipType	通路類別	1=7-ELEVEN
ServiceType	取貨方式	1=取貨付款,3=取貨不付款
ShipAmt	取貨付款金額	　　
StoreID	取件門市代碼	　　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
Consignee	收件人名稱	限制長度:10 最長5個中文字、最短至少2個中文字或4個英文字 (請填寫真實姓名，超商取件時核對身分使用) 　　
ConsigneeMobile	收件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用) 　　
ConsigneeMail	收件人電子信箱	　　
愛金卡 (ICash)
(PaymentType=6)	說明	備註
PayNo	愛金卡交易序號	　　
PayTime	付款日期時間	格式: YYYY-MM-DD HH:II:SS
後支付 (Aftee)
(PaymentType=7)	說明	備註
PayNo	Aftee交易序號	　　
CreateDT	交易建立日期時間	　　
LINE Pay
(PaymentType=9)	說明	備註
PayNo	LINEPay交易號碼	
PayTime	付款日期時間	格式: YYYY-MM-DD HH:II:SS
宅配到付
(PaymentType=10)	說明	備註
TradeType	宅配類別	固定1=正物流　
ShipTradeNo	物流單號	　　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
LgsType	物流型態	HOME=黑貓宅配
ShipType	通路類別	2=黑貓宅配
ServiceType	取貨方式	1=取貨付款,3=取貨不付款
ShipAmt	取貨付款金額	　　
Consignee	收件人名稱	　　
ConsigneeMobile	收件人手機號碼	　　
ConsigneeTel	收件人聯絡電話	區碼+號碼
若有帶時，會回 00-00000000
若交易當下沒帶時，則回 -
ConsigneeAddress	收件人地址	
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
ProductTypeId	商品類別代碼	0001=一般食品
0002=名特產/甜產
0003=酒/油/醋/醬
0004=穀物蔬果
0005=水產/肉品
0006=3C
0007=家電
0008=服飾配件
0009=生活用品
0010=美容彩妝
0011=保健食品
0012=醫療相關用品
0013=寵物用品飼料
0014=印刷品
0015=其他
ProdDesc	商品名稱	
街口支付(JKoPay)
(PaymentType=11)	說明	備註
JKoTradeNo	JKoPay交易號碼	
JKoStrCupAmt	店家街口券折抵	
JKoChannel	支付工具	account=儲值帳戶
bank=銀行帳戶
creditcard=信用卡
PayTime	付款日期時間	格式: YYYY-MM-DD HH:II:SS
當該交易有使用優惠劵核銷
將回傳以下參數：
參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號		
```


## <a id="36"></a>虛擬帳號幕後(ATM) (7/36)

```
虛擬帳號幕後(ATM)
簡要描述
串接前置作業
支付項目
ATM轉帳交易流程
請求 URL
請求方式
串接金鑰
測試區ATM轉帳付款完成測試
請求參數
返回參數
虛擬帳號幕後(ATM)
簡要描述
PAYUNi平台提供ATM轉帳單串機制，可滿足幕後取號交易。
會員須向PAYUNi提出申請且需綁定幕後取號IP，待審核開通後即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
請於左方目錄相關文件及申請書下載，下載申請表單向PAYUNi提出機制申請與綁定IP，審核通過後即可串接。。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
ATM轉帳	支援單繳帳號(一次性虛擬帳號)
ATM轉帳交易流程
ATM 轉帳幕後交易

ATM 轉帳幕後交易，綁定買方hash
※需先透過 UPP API於前景支付頁取得買方hash。

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/atm

正式區：https://api.payuni.com.tw/api/atm

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區ATM轉帳付款完成測試
如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.3
EncryptInfo	Y	string	加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	加密 Hash	請參考請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考訂單金額限制說明
Timestamp	Y	int	時間戳記	格式: time()
BankType	Y	string	銀行(代碼)	請參考銀行代碼(數字)
PaySet	C	int	繳費帳號類型	1=單繳帳號(一次性)(預設)

NotifyURL	C	string	背景通知網址
將交易資料通知指定網址	格式: 完整網址
僅限80與443 port
UsrMail	Y,C	string	消費者信箱	格式: 信箱格式
若有開啟物流功能時此欄必填，將視為物流收件人信箱
若有開啟電子發票功能且CarrierType=amego時，此欄位必填
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
ExpireDate	C	string	繳費截止日期	格式: YYYY-MM-DD
PaySet=1時,最少值為當日,最大值為當日+180天,如未帶此參數預設為當日+7天

BuyerHash	C	string	買方會員Token Hash	帶入買方 Token Hash 可完成買方驗證及交易綁定於此買方會員
若商店啟用開放交易金額上限，且交易金額大於訂單金額限制時，此欄位為必填
買方 Token Hash取得方式：請先使用 整合式支付頁 UNiPaypage (UPP)帶入BuyerToken參數，消費者完成買方註冊或登入且交易完成後取得
CarrierType	Y,C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y,C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　

若有開啟物流功能時，使用虛擬帳號幕後API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字(請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)　
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定

備註：有帶ServiceType時，當作取貨不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.3
EncryptInfo	加密字串	請參考資料加解密
HashInfo	加密 Hash	請參考資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
Message	狀態說明	(ATM)建立成功=ATM轉帳取號成功
若失敗請參考錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	0=取號成功
PaymentType	支付工具	2=ATM轉帳
BankType	銀行(代碼)	請參考銀行代碼(數字)
PayNo	繳費虛擬帳號	　　
PaySet	繳費帳號類型	1=單繳帳號(一次性)

ExpireDate	繳費截止日期	格式: YYYY-MM-DD HH:II:SS


若有開啟優惠劵功能時，使用優惠碼於幕後API
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用虛擬帳號幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
PartnerId	母代碼	　
StoreID	門市代碼	例如：916712　
StoreName	門市名稱	　
StoreAddr	門市地址	　
ConsigneeMail	取件人電子信箱	

黑貓宅配取貨不付款
(ShipType=2)	說明	備註
TradeType	宅配類別	固定為1=正物流
ConsigneeTel	收件人聯絡電話	區碼+號碼
若有帶時，會回 00-00000000
若交易當下沒帶時，則回 -　
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
ProductTypeId	商品類別代碼	0001=一般食品
0002=名特產/甜產
0003=酒/油/醋/醬
0004=穀物蔬果
0005=水產/肉品
0006=3C
0007=家電
0008=服飾配件
0009=生活用品
0010=美容彩妝
0011=保健食品
0012=醫療相關用品
0013=寵物用品飼料
0014=印刷品
0015=其他　
ProdDesc	商品名稱	　
```


## <a id="37"></a>虛擬帳號幕後(ATM) (7/37)

```
虛擬帳號幕後(ATM)
簡要描述
串接前置作業
支付項目
ATM轉帳交易流程
請求 URL
請求方式
串接金鑰
測試區ATM轉帳付款完成測試
請求參數
返回參數
虛擬帳號幕後(ATM)
簡要描述
PAYUNi平台提供ATM轉帳單串機制，可滿足幕後取號交易。
會員須向PAYUNi提出申請且需綁定幕後取號IP，待審核開通後即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
請於左方目錄相關文件及申請書下載，下載申請表單向PAYUNi提出機制申請與綁定IP，審核通過後即可串接。。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
ATM轉帳	支援單繳帳號(一次性虛擬帳號)
ATM轉帳交易流程
ATM 轉帳幕後交易

ATM 轉帳幕後交易，綁定買方hash
※需先透過 UPP API於前景支付頁取得買方hash。

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/atm

正式區：https://api.payuni.com.tw/api/atm

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區ATM轉帳付款完成測試
如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.3
EncryptInfo	Y	string	加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	加密 Hash	請參考請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考訂單金額限制說明
Timestamp	Y	int	時間戳記	格式: time()
BankType	Y	string	銀行(代碼)	請參考銀行代碼(數字)
PaySet	C	int	繳費帳號類型	1=單繳帳號(一次性)(預設)

NotifyURL	C	string	背景通知網址
將交易資料通知指定網址	格式: 完整網址
僅限80與443 port
UsrMail	Y,C	string	消費者信箱	格式: 信箱格式
若有開啟物流功能時此欄必填，將視為物流收件人信箱
若有開啟電子發票功能且CarrierType=amego時，此欄位必填
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
ExpireDate	C	string	繳費截止日期	格式: YYYY-MM-DD
PaySet=1時,最少值為當日,最大值為當日+180天,如未帶此參數預設為當日+7天

BuyerHash	C	string	買方會員Token Hash	帶入買方 Token Hash 可完成買方驗證及交易綁定於此買方會員
若商店啟用開放交易金額上限，且交易金額大於訂單金額限制時，此欄位為必填
買方 Token Hash取得方式：請先使用 整合式支付頁 UNiPaypage (UPP)帶入BuyerToken參數，消費者完成買方註冊或登入且交易完成後取得
CarrierType	Y,C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y,C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　

若有開啟物流功能時，使用虛擬帳號幕後API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字(請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)　
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定

備註：有帶ServiceType時，當作取貨不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.3
EncryptInfo	加密字串	請參考資料加解密
HashInfo	加密 Hash	請參考資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
Message	狀態說明	(ATM)建立成功=ATM轉帳取號成功
若失敗請參考錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	0=取號成功
PaymentType	支付工具	2=ATM轉帳
BankType	銀行(代碼)	請參考銀行代碼(數字)
PayNo	繳費虛擬帳號	　　
PaySet	繳費帳號類型	1=單繳帳號(一次性)

ExpireDate	繳費截止日期	格式: YYYY-MM-DD HH:II:SS


若有開啟優惠劵功能時，使用優惠碼於幕後API
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用虛擬帳號幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
PartnerId	母代碼	　
StoreID	門市代碼	例如：916712　
StoreName	門市名稱	　
StoreAddr	門市地址	　
ConsigneeMail	取件人電子信箱	

黑貓宅配取貨不付款
(ShipType=2)	說明	備註
TradeType	宅配類別	固定為1=正物流
ConsigneeTel	收件人聯絡電話	區碼+號碼
若有帶時，會回 00-00000000
若交易當下沒帶時，則回 -　
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
ProductTypeId	商品類別代碼	0001=一般食品
0002=名特產/甜產
0003=酒/油/醋/醬
0004=穀物蔬果
0005=水產/肉品
0006=3C
0007=家電
0008=服飾配件
0009=生活用品
0010=美容彩妝
0011=保健食品
0012=醫療相關用品
0013=寵物用品飼料
0014=印刷品
0015=其他　
ProdDesc	商品名稱	　
```


## <a id="326"></a>超商代碼幕後(CVS) (7/326)

```
超商代碼幕後(CVS)
簡要描述
PAYUNi平台提供超商代碼繳費單串機制，可滿足幕後取號交易，會員須向PAYUNi提出申請，審核開通且綁定幕後授權IP即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
請於左方目錄相關文件及申請書下載，下載申請表單向PAYUNi提出機制申請與綁定IP，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
超商代碼繳費	可持超商代碼至全台統一超商，使用多媒體事務機列印繳費單臨櫃付款
超商代碼繳費交易流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/cvs
正式區：https://api.payuni.com.tw/api/cvs
※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。
請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區超商代碼繳費付款完成測試
如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.3
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考訂單金額限制說明
Timestamp	Y	int	時間戳記	格式: time()
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址	格式: 完整網址
僅限80與443 port
UsrMail	Y,C	string	消費者信箱	格式: 信箱格式
若有開啟物流功能時此欄必填，將視為物流收件人信箱
若有開啟電子發票功能且CarrierType=amego時，此欄位必填
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
ExpireDate	C	string	繳費截止日期	格式: YYYY-MM-DD
最少值為當日,最大值為當日+7天
若截止日設定為當日，請注意訂單成立後至少需有 2 小時的繳費時間，若小於2小時，請設定日期為隔日
CarrierType	Y,C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y,C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　

若有開啟物流功能時，使用超商代碼幕後API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字 (請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)　
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定

備註：有帶ServiceType時，當作取貨不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.3
EncryptInfo	加密字串	請參考資料加解密
HashInfo	加密 Hash	請參考資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
Message	狀態說明	(CVS)建立成功=超商代碼取號成功
若失敗請參考錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	0=取號成功
PaymentType	支付工具	3=條碼/代碼
PayNo	繳費代碼/條碼	　　
Store	超商(代碼)	　　
ExpireDate	繳費截止日期	格式: YYYY-MM-DD HH:II:SS

若有開啟優惠劵功能時，使用優惠碼於幕後API
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用超商代碼幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
PartnerId	母代碼	　
StoreID	門市代碼	例如：916712　
StoreName	門市名稱	　
StoreAddr	門市地址	　
ConsigneeMail	取件人電子信箱	

黑貓宅配取貨不付款
(ShipType=2)	說明	備註
TradeType	宅配類別	固定為1=正物流
ConsigneeTel	收件人聯絡電話	區碼+號碼
若有帶時，會回 00-00000000
若交易當下沒帶時，則回 -　
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
ProductTypeId	商品類別代碼	0001=一般食品
0002=名特產/甜產
0003=酒/油/醋/醬
0004=穀物蔬果
0005=水產/肉品
0006=3C
0007=家電
0008=服飾配件
0009=生活用品
0010=美容彩妝
0011=保健食品
0012=醫療相關用品
0013=寵物用品飼料
0014=印刷品
0015=其他　
ProdDesc	商品名稱	　
```


## <a id="350"></a>LINE Pay幕後 (7/350)

```
LINE Pay幕後
簡要描述
PAYUNi平台提供LINE Pay單串機制，可滿足幕後交易，會員須向PAYUNi提出申請，審核開通且綁定IP即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
請於左方目錄相關文件及申請書下載，下載申請表單向PAYUNi提出機制申請與綁定IP，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
LINE Pay幕後交易流程

注意事項：
使用LINE Pay需先申請成為LINE Pay合作商店並提供Channel ID & Secret Key
使用LINE Pay將額外產生交易處理費。

-申請成為LINE Pay合作商店
-取得 Channel ID & Secret Key

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/linepay

正式區：https://api.payuni.com.tw/api/linepay

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區測試ID
測試區收款：申請LINE Pay時的Channel ID與 Channel Secret Key可填隨意數字
測試區付款：於LINE Pay完成綁定信用卡後即可於測試區付款(請於App Store或Google Play下載及安裝LINE Pay)
不限卡號於測試區皆為模擬成功
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.2
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考訂單金額限制說明　
Timestamp	Y	int	時間戳記	格式: time()
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址，僅於平台點選補觸發時，及收到回覆為UNKNOWN時後續通知交易結果使用	格式: 完整網址
僅限80與443 port
UsrMail	Y,C	string	消費者信箱	格式: 信箱格式
若有開啟物流功能時此欄必填，將視為物流收件人信箱
若有開啟電子發票功能且CarrierType=amego時，此欄位必填
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
ReturnURL	C	string	返回指定網址
	格式: 完整網址
DeepLinkURL	C	string	可打開特定的應用內容，包含APP、網站等。
	格式: 完整網址
此欄位有值時不會觸發ReturnURL
CarrierType	Y/C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y/C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　

若有開啟物流功能時，使用LINE Pay幕後API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字 (請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)　
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定

備註：有帶ServiceType時，當作貨到不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.1
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	成功=交易成功
若失敗請參考 錯誤代碼
UNKNOWN=系統忙碌中，尚未確認交易結果
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-] 　　
Gateway	閘道	1=單串,2=UPP　
TradeNo	PAYUNi訂單編號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	0=建立
1=成功
2=失敗
PaymentType	支付工具	9=LINE Pay
LinePayID	LinePayID	　　
QRToken	導頁網址	　　
QRExpiredTime	導頁網址有效日期時間	　　

若有開啟優惠劵功能時，使用優惠碼於幕後API
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用LINE Pay幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
StoreID	取件門市代碼	例如：916712　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
黑貓宅配取貨不付款
(ShipType=2)	說明	備註
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
```


## <a id="386"></a>AFTEE幕後 (7/386)

```
AFTEE幕後
簡要描述
PAYUNi平台提供AFTEE先享後付單串機制，可滿足幕後交易，會員須向PAYUNi提出申請，審核開通且綁定IP即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
請於左方目錄相關文件及申請書下載，下載申請表單向PAYUNi提出機制申請與綁定IP，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
AFTEE幕後交易流程

注意事項：
AFTEE付款金額需介於$20至$49,999元之間。
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/aftee_direct

正式區：https://api.payuni.com.tw//api/aftee_direct

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區測試ID
測試模式中僅接受下述電話號碼
消費者非AFTEE會員：0909999981
消費者是AFTEE會員：0909999991 密碼：Password1234
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.1
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考訂單金額限制說明　
Timestamp	Y	int	時間戳記	格式: time()
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址，僅於平台點選補觸發時，及收到回覆為UNKNOWN時後續通知交易結果使用	格式: 完整網址
僅限80與443 port
UsrMail	C	string	消費者信箱	格式: 信箱格式
若有開啟物流功能時為必填，將視為物流收件人信箱
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
ReturnURL	C	string	返回指定網址
	格式: 完整網址
DeepLinkURL	C	string	可打開特定的應用內容，包含APP、網站等。
	格式: 完整網址
此欄位有值時不會觸發ReturnURL
BuyerHash	C	string	買方會員Token Hash	帶入買方 Token Hash 可完成買方驗證及交易綁定於此買方會員
若商店啟用開放交易金額上限，且交易金額大於訂單金額限制時，此欄位為必填
買方 Token Hash取得方式：請先使用 整合式支付頁 UNiPaypage (UPP)帶入BuyerToken參數，消費者完成買方註冊或登入且交易完成後取得

以下欄位僅適用於特定合作情境，請依照與平台協議內容傳遞以下參數，若無請帶空字串。

參數
(EncryptInfo)	必要	類型	說明	備註
CustName	C	string	姓名	100 字以內文字
PhoneNo	C	String	手機號碼	09 開頭 10 位半形數字
Addr	C	String	地址	255 字以内文字
AddInfoCode	C	String	額外資訊碼	4 位文字，由AFTEE提供。
DestCustName	C	String	收件姓名	100 字以內文字
DestAddr	C	String	收件地址	255 字以内文字
不含空白鍵
若為超商取貨，請填寫超商名稱(7-11/全家/萊爾富/OK)，如:7-11台北市信義區松智路1號
DestTel	C	String	收件電話號碼	0 開頭 9～10 位數的半形數字（市話須包含區碼）
ItemID	C	String	商家商品 ID	半形英文或數字（100字以内）不含空白鍵 ，複數商品請用,分隔
ItemName	C	String	商品名稱	100 字以內文字不含空白鍵 ，複數商品請用,分隔
ItemCategory	C	String	商品類別	100 字以內文字不含空白鍵 ，複數商品請用,分隔
ItemCount	C	String	個數	1 以上不超過 5 位數的整数（不需補零）。例如：12並非00012 ，複數商品請用,分隔
ItemPrice	C	String	商品單價	0 或不超過 6 位數的整數（不需補零）。例如：12並非000012 ，複數商品請用,分隔

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　

若有開啟物流功能時，使用AFTEE幕後API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字 (請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)　
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定

備註：有帶ServiceType時，當作貨到不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=付款成功
UNAPPROVED=訂單待確認，買家會員資格審查中
OK=審核通過(不代表付款成功)
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.1
EncryptInfo	加密字串	請參考資料加解密
HashInfo	加密 Hash	請參考資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=付款成功
UNAPPROVED=訂單待確認，買家會員資格審查中
OK=審核通過(不代表付款成功)
若失敗請參考 錯誤代碼
Message	狀態說明	成功=交易成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-] 　　
Gateway	閘道	1=單串,2=UPP　
TradeNo	PAYUNi訂單編號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	0=建立
1=成功
2=失敗
PaymentType	支付工具	7=AFTEE
URL	支付網址	

若有開啟優惠劵功能時，使用優惠碼於幕後API
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用AFTEE幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
StoreID	取件門市代碼	例如：916712　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
黑貓宅配取貨不付款
(ShipType=2)	說明	備註
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
```


## <a id="511"></a>街口支付幕後(JKoPay) (7/511)

```
街口支付幕後(JKoPay)
簡要描述
PAYUNi平台提供街口支付單串機制，可滿足幕後交易，會員須向PAYUNi提出申請，審核開通且綁定IP即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
請於左方目錄相關文件及申請書下載，下載申請表單向PAYUNi提出機制申請與綁定IP，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/jkopay

正式區：https://api.payuni.com.tw/api/jkopay

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.1
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考訂單金額限制說明　
Timestamp	Y	int	時間戳記	格式: time()
ReturnURL	C	string	前景通知網址
付款完成返回指定網址(Form Post)
若空值，付款後呈現PAYUNi付款結果頁或取號完成頁面
交易結果請以NotifyURL為主	格式: 完整網址
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址	格式: 完整網址
僅限80與443 port
DeepLinkURL	C	string	可打開特定的應用內容，包含APP、網站等。
	格式: 完整網址
此欄位有值時不會觸發ReturnURL
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
UsrMail	Y,C	string	消費者信箱	格式: 信箱格式
若有開啟物流功能時此欄必填，將視為物流收件人信箱
若有開啟電子發票功能且CarrierType=amego時，此欄位必填
CarrierType	Y,C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y,C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　

若有開啟物流功能時，使用街口支付幕後API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字 (請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)　
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定

備註：有帶ServiceType時，當作貨到不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.1
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	成功=交易成功
若失敗請參考 錯誤代碼
UNKNOWN=系統忙碌中，尚未確認交易結果
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-] 　　
Gateway	閘道	1=單串　
TradeNo	PAYUNi訂單編號	　　
TradeAmt	訂單金額	　　
JKoTradeNo	JKoPay交易號碼	
JKoStrCupAmt	店家街口券折抵	
JKoChannel	支付工具	account=儲值帳戶
bank=銀行帳戶
creditcard=信用卡
TradeStatus	訂單狀態	0=建立
1=成功
2=失敗
PaymentType	支付工具	11=JKoPay
PayTime	付款日期時間	格式: YYYY-MM-DD HH:II:SS

當該交易有使用優惠劵核銷
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用街口支付幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
StoreID	取件門市代碼	例如：916712　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
黑貓宅配取貨不付款
(ShipType=2)	說明	備註
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
```


## <a id="512"></a>免跳轉元件(UNi Embed) (7/512)

```
免跳轉元件(UNi Embed)
版本差異說明




API Ver 3.0 / JS SDK Ver 2.0 （2025年9月釋出，釋出當日開始申請的會員請串接此版本）
1. 取得 SDK Token 無須帶訂單資料
只需送出信用卡號等卡片資訊即可取得交易 Token，不需在此階段提供訂單編號、金額等資訊。
2. 流程分為「卡號綁定」與「交易授權」兩步
SDK 僅負責蒐集信用卡資訊並進行 SDK Token 綁定。
商戶前端取得綁定結果後，需自行呼叫另一支 API 進行交易授權，並在取得交易結果後自行核對訂單金額及資訊。




API Ver 2.0 / JS SDK Ver 2.0（舊版，2025年10月後不再更新）
1. 取得 SDK Token 必須先送訂單資料
在請求 SDK Token 時，必須同時提交完整訂單資訊（例如訂單編號、金額）。
2. SDK 取得信用卡資訊後即進行交易授權
SDK 蒐集完信用卡資訊後，系統會直接執行交易授權。
回傳結果可能為直接取得授權結果或需跳轉至銀行 3D 驗證頁的網址。





如需進一步支援或有任何問題，請聯繫 PAYUNi 技術支援團隊。
© 2025 PAYUNi Co., Ltd. All rights reserved.
```


## <a id="513"></a>免跳轉支付元件(UNi Embed) (7/513)

```
免跳轉支付元件(UNi Embed)
簡要描述

免跳轉元件提供給商店及代理商網站，使用iframe方式，嵌入支付元件進行付款作業，目前僅提供信用卡支付工具使用。

串接前請先進行前置作業的申請，並且依照本文件的步驟，進行免跳轉支付元件串接及參數設定。

串接前置作業
功能開通申請

一般商店：請於 PAYUNi 平台註冊會員，並且建立收款商店，取得商店代號 (MerID) 申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw

串接免跳轉元件前，會員必須提出申請，請聯繫客服或是商務人員，提出免跳轉元件申請並設定限定IP，開通後即可進行串接。

代理商：申請代理商合作資格並且與統一金流平台簽訂相關代理商合作業務契約，請於 PAYUNi 平台註冊會員，申請開通所免跳轉元件功能。相關申請文件可至申請書下載區下載。

環境要求
自 PAYUNi API 取得 SDK_TOKEN（有效期限 10 分鐘）
支援 JavaScript 的現代網頁瀏覽器
安全的 HTTPS 連線環境


支援交易類型
信用卡: 支援 Visa、MasterCard、JCB、銀聯卡
類型	備註
一次付清	包含國內卡、國外卡
分期付款	包含3期、6期、9期、12期、18期、24期、30期 (各銀行支援期數)
信用卡記憶卡號：可提供持卡人在付款時選擇是否記憶卡號與到期日，以利下次支付時於結帳頁面自動帶出卡號
信用卡Token
包含約定信用卡，及強制約定信用卡功能
首次交易時持卡人與商店進行信用卡 Token交易，並且完成信用卡約定，爾後商店使用該信用卡 Token，即可採用幕後方式進行該約定之授權交易
此功能可達到自訂排程，不定期不定額授權交易
使用此功能需先向 PAYUNi 平台申請審核開通且綁定 IP
後續Token交易請參考信用卡幕後Token交易
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
一次付清(模擬3D交易ECI值不符主動取消授權)：4147631000000002，3560511000000002
分期付款：3560562000000001，4147632000000001(不支援9期)，3560512000000001(不支援9期)
卡片到期日及背面末三碼可任意填入




免跳轉支付元件交易流程
免跳轉支付(3D)




免跳轉支付(非 3D)




取得交易 SDK TOKEN
進行交易前，須先透過 PAYUNi API 取得 SDK TOKEN，使用時效為 10 分鐘
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/iframe/token_get

正式區：https://api.payuni.com.tw/api/iframe/token_get

※為配合國際組織與各收單銀行對網站 SSL 傳輸加密機制要求，敬請採用 TLS v1.2 以上協定。

請求方式
HTTP POST
請於 header 加入 user-agent，建議內容為payuni
串接金鑰
請登入 PAYUNi 平台檢視商店串接資訊取得 Hash Key 及 Hash IV。
如使用代理商金鑰串接時，請登入 PAYUNi 平台>代理商專區> 合約及基本資料，取得串接金鑰 Hash Key及 Hash IV。

如使用代理商金鑰串接時，需增加請求參數 IsPlatForm=1 且與 MerID Version EncryptInfo HashInfo 同層
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 3.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
Timestamp	Y	int	時間戳記	格式: time()
IFrameDomain	Y	string	使用元件之限定網域名稱(Domain)	格式: 填入網域限https，網域名稱只能包含中文、a-z、0-9 和 – (連字號)。不能在標籤開頭或結尾指定連字號
範例：https://www.payuni.com.tw
首次信用卡Token交易請求參數
Y=必要；C=選填
若有需要使用首次信用卡Token交易，在請求參數項目中需帶入以下三項參數。
信用卡 Token 類型包含：約定信用卡、強制約定信用卡、記憶記憶信用卡號及到期日
約定信用卡及強制約定信用卡完成後，可從 信用卡Token查詢(約定)(CREDIT) 查詢已約定的 CreditHash。
後續Token交易請參考信用卡幕後Token交易
參數
(EncryptInfo)	必要	類型	說明	備註
UseTokenType	C	int	信用卡 Token 類型
如需使用信用卡Token交易，此參數為必填	1=約定信用卡，至付款頁面時消費者可自行取消約定
2=記憶卡號功能，預設為記憶卡號+到期日
3=強制約定信用卡，消費者無法取消
CreditToken	C	string	信用卡Token
如有使用 UseTokenType 參數，此參數為必填。
付款人綁定資料使用，例：會員編號、Email、手機等	長度限制: 200
格式: [A-Z a-z 0-9 @.#$%_-]
CreditTokenType	C	int	信用卡 Token 紀錄類型，預設為會員。
會員:
會員旗下所有商店代號共用此Token
商店:
僅限於首次交易商店代號可使用此Token	1=會員
2=商店
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考
錯誤代碼
MerID	商店代號	　　
Version	版本	固定 3.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=取得Token成功
若失敗請參考 錯誤代碼
Message	狀態說明	成功=取得token成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Token	SDK_Token	uniPayment Javascript SDK 驗證參數
TokenExpired	Token 逾期時間	超過10分鐘為逾期




串接 uniPayment Javascript SDK
SDK引入規範

僅可使用 PAYUNi 官方提供的 JavaScript SDK

SDK 位址：https://vendor.payuni.com.tw/sdk/uni-payment.js

安全性考量

禁止下載 uni-payment.js 至自有主機託管

因應 Content-Security-Policy，請將下列下列網域設定至 script-src, frame-src 中
正式環境: https://vendor.payuni.com.tw
測試環境: https://sandbox-vendor.payuni.com.tw

若有串接Ver 1.0 版本，可移除 v1.0 版的 https://api.payuni.com.tw ,https://sandbox-api.payuni.com.tw

基本設定
1. 引入 SDK 腳本
<script src="https://vendor.payuni.com.tw/sdk/uni-payment.js"></script>

2. 設置 HTML 元素
<div class="payment-form">
    <div class="form-group">
        <label>信用卡號碼</label>
        <div id="put_card_no"></div>
    </div>
    <div class="form-group">
        <label>有效期限</label>
            <div id="put_card_exp"></div>
    </div>
    <div class="form-group">
        <label>安全碼</label>
        <div id="put_card_cvc"></div>
    </div>
</div>

3. 配置 SDK
const options = {
    env: "P",  // P: 正式環境, S: 測試環境
    useInst: false, 
    elements: {
        CardNo: "put_card_no",
        CardExp: "put_card_exp",
        CardCvc: "put_card_cvc"
    },
    style: {
        color: "#000000",
        errorColor: "#FF0000",
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "24px"
    }
};

// SDK_TOKEN 由後端串接 PAYUNi API 所取得 
const payuniSDK = UniPayment.createSession(SDK_TOKEN, options);

參數	種類	說明	必填	預設
env	String	使用環境(P 為正式，S 為測試)	否	P
useInst	Boolean	是否使用分期	否	false
elements	Object	設定連動相關 div ID	是	如上範例
style	Object	設定預設的 input style	否	如上範例
4. 檢查連線並產生輸入元件

連線成功後將會在頁面上看到信用卡交易相關的輸入元件，若未正確顯示輸入元件請確認取得的錯誤訊息，並對照錯誤代碼表

async function startProcess() {
    try {
      let resp = await payuniSDK.start()
      console.log("連線成功:", resp);
    } catch (error) {
      console.error("連線失敗:", error);
      // 可以取得 error.message 作客製化錯誤處理, 範例如下:
      // if (error.message === "Code 1008") alert("iframe 連線超時(timeout), 請重新整理")
    }
}
//執行連線
startProcess()

來源驗證機制 (段落排版參考下圖)
免跳轉支付元件會檢查當前網站的來源 (origin) 是否與商店取得 Token 時的 IFrameDomain 一致，確保僅合法商店頁面能載入支付元件。
若使用者啟用了隱私權設定較嚴格的瀏覽模式（如 Safari 私密瀏覽），瀏覽器可能會隱藏來源資訊，導致無法進行驗證。
在無法驗證來源的情況下，系統不會中斷輸入流程，但會於信用卡號輸入框下方顯示警語，提醒使用者確認頁面來源。

事件處理

onUpdate 可取得使用者輸入表單的狀態方法或其他事件處理機制

payuniSDK.onUpdate(function (update) {
    const { status, event, data } = update;

    // 表單驗證狀態處理
    if (status) {
        // 從 status 取得元件的輸入狀態與驗證狀態
        // {
        //     "CardNo": null,
        //     "CardExp": true,
        //     "CardCvc": true
        // }

    }

    // 特定事件處理
    if (event === "useTokenType") {
        // ... 記憶卡號相關邏輯
    }
});

onUpdate 回調函數
屬性	類型	說明
callback	function(update: Object)	當有更新時被調用的回調函數
update.status	Object	輸入元件的輸入狀態
update.event	String	SDK 會出現的相關事件，對應相關 data
update.data	Object	因應事件會有的相關資料
status 類型
名稱	內容
update.status.CardNo	
true	欄位已填好，並且沒有問題
null	欄位還沒有填寫
false	欄位有錯誤，input view 的輸入框會顯示 errorColor 設定的顏色
typing	使用者正在輸入中

update.status.CardExp	
true	欄位已填好，並且沒有問題
null	欄位還沒有填寫
false	欄位有錯誤，input view 的輸入框會顯示 errorColor 設定的顏色
typing	使用者正在輸入中

update.status.CardCvc	
true	欄位已填好，並且沒有問題
null	欄位還沒有填寫
false	欄位有錯誤，input view 的輸入框會顯示 errorColor 設定的顏色
typing	使用者正在輸入中
event 類型
名稱	說明
useTokenType	當此交易會使用到記憶卡號/約定信用卡/強制約定信用卡時可取得此參數
data 類型

useTokenType相關:

名稱	說明
tokenType	本次交易是否啟用 “1” = 約定信用卡, “2” = 記憶卡號快速交易, “3” = 強制約定信用卡
tokenTypeText	checkbox 的說明文字, 可參考使用
cardNo	快速記憶的卡號 (tokenType = '2' 才會有, 第一次交易沒有卡號時, 則為 null)
交易流程

當使用者輸入完資料，並透過 onUpdate() 回傳的 status 皆為 true 時，即可使用 getTradeResult()方法執行交易流程。 .

1. 取得信用卡綁定 TOKEN 結果
// 基本一次付清
async function processPayment() {
    try {
      const result = await payuniSDK.getTradeResult();
      console.log("取得信用卡號綁定 TOKEN 結果:", result);
      // 取得成功後再將原始的 SDK_TOKEN 進行幕後交易授權
    } catch (error) {
      console.error("信用卡號綁定 TOKEN 失敗:", error);
      // 建議於此處進行 Error Handle
    }
}

// 進階配置範例:商店可使用的分期、記憶卡號資訊取得方式請參考進階功能
const paymentConfig = {    
    cardInst: 3,     // 分期期數
    useDefault: true, // 使用信用卡記憶卡號進行快速結帳
};
await payuniSDK.getTradeResult(paymentConfig);

// 單一功能配置範例
await payuniSDK.getTradeResult({ cardInst: 12 }); // 僅設定 12 期分期


配置參數說明：

屬性名稱	類型	說明	預設
cardInst	Number	要使用的分期期數；需先透過 getCardAcceptInfo() 取得可分期期期數	預設為: 1，有開啟分期付款才有效
useDefault	Boolean	使用記憶卡號交易，會忽略 CardNo 的輸入值	預設為: false ，當已啟用記憶卡號時應設為 true
2. 幕後交易
取得信用卡綁定 TOKEN 結果後，使用原交易TOKEN(SDK_TOKEN)，進行幕後交易授權。
3D 交易於API3D參數帶入值，進行3D網址導轉與交易授權，交易結果由NotifyURL返回。
如使用代理商金鑰串接時，需增加請求參數 IsPlatForm=1 且與 MerID Version EncryptInfo HashInfo 同層
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/iframe/merchant_trade
正式區：https://api.payuni.com.tw/api/iframe/merchant_trade
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
Token	Y	string	SDK_Token	由 token_get API 取得
TradeAmt	Y	int	訂單金額	請參考 訂單金額限制說明　　
Timestamp	Y	int	時間戳記	格式: time()
ReturnURL	C	string	前景通知網址
付款完成返回指定網址(Form Post)
若空值，付款後呈現 PAYUNi 付款結果頁
交易結果請以NotifyURL為主	格式: 完整網址
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址	格式: 完整網址
僅限80與443 port
UsrMail	C	string	消費者信箱	格式: 信箱格式
付款頁帶入付款人信箱
若未帶參數則空白
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
API3D	C	int	指定3D	1=指定3D
當商店信用卡3D設定為關閉3D時，可帶入此參數表示此筆交易指定使用3D交易
BuyerHash	C	string	買方會員已綁定 Hash
交易時帶入買方 Hash 可完成買方驗證及交易綁定	註：買方 Hash 經由 UPP 交易使用 BuyerToken 綁定後取得
CarrierType	Y,C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y,C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。
UserIP	C	string	消費者IP
若有帶入則會列入全平台風險管控機制，協助阻擋異常交易	格式: 支援IPv4 和 IPv6 格式
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考
錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.2
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
UNAPPROVED=訂單待確認，買家會員資格審查中
若失敗請參考錯誤代碼
Message	狀態說明	授權成功=信用卡授權成功
(CVS)建立成功=超商代碼取號成功
(ATM)建立成功=ATM轉帳取號成功
若失敗請參考錯誤代碼
UNKNOWN=系統忙碌中，尚未確認交易結果
當60秒無收到銀行回應會先回覆UNKNOWN，後續若有取得交易結果會Notify至NotifyURL，或建議可於15分鐘後發動交易查詢確認交易狀態
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
Gateway	交易標記	9=免跳轉支付元件(IFrame)
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	1=已付款
2=付款失敗
3=付款取消
8=訂單待確認
PaymentType	支付工具	1=信用卡
CardBank	發卡銀行(代碼)	若為國內發卡行則為銀行代碼(3碼)，若非國內發卡行則為”-“
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardInst	分期數	　　
FirstAmt	首期金額	　　
EachAmt	每期金額	　　
ResCode	回應碼	　　
ResCodeMsg	回應碼敘述	　　
AuthCode	授權碼	　　
AuthBank	授權銀行(代碼)	　　
AuthBankName	授權銀行(名稱)	　　
AuthType	授權類型	1=一次
2=分期
7=銀聯
AuthDay	授權日期	格式: YYYYMMDD
AuthTime	授權時間	格式: HHIISS
CreditHash	信用卡Token Hash	Token專用返回參數有 CreditToken 且授權成功才會壓碼
CreditLife	信用卡Token 有效日期	格式: MMYY
CoBrandCode	聯名卡代號	聯名卡交易識別代號(需事先設定)
強制3D
(API3D=1)	說明	備註
Status	狀態代碼	SUCCESS=建立幕後3D成功
若失敗請參考錯誤代碼
Message	狀態說明	建立幕後3D成功
若失敗請參考錯誤代碼
URL	強制3D導頁網址	　　
SDK 自訂樣式

當 input 欄位處於 focus 狀態時，SDK 會自動加上 form-input-focus class。您可以透過自訂 CSS 來設定 focus 狀態的樣式：

  .form-input-focus {
    border-color: #ffffff;
    outline: 0;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px #0485ff73;
    box-shadow: 0px 0px 4px 0.1rem #0485ff73;
  }

進階功能
信用卡分期付款

使用 getCardAcceptInfo() 取得可用的分期期數發卡銀行。您需自行建立分期期數的選擇元素或是顯示可用分期資訊。

注意：需等待 payuniSDK.start() 完成後才能呼叫此方法。
try {
    // 取得分期相關資訊
    const info = await payuniSDK.getCardAcceptInfo();
    // 分期資訊範例
    // info.CreditInst = {
    //     "3": "中信、台新、國泰...",
    //     "6": "中信、台新、國泰...",
    //     "12": "中信、台新、國泰..."
    // }
} catch (error) {
    console.error("取得資訊失敗:", error);
}


回傳資料說明：

參數	類型	說明
CreditInst	Object	分期資訊，key 為期數，value 為支援銀行清單
記憶卡號、約定信用卡與強制約定信用卡
1. 設置 HTML 元素
使用記憶卡號和約定信用卡相關功能時，需要消費者勾選啟用與否，請預先設置產生核取方塊的 HTML 容器以及文案顯示位置
for="type-checkbox"的設置可讓使用者點擊文字時同時點擊核取方塊

為配合 payuniSDK.onUpdate 顯⽰，可先將 token_type_checkbox_area 設定隱藏

<div id="token_type_checkbox_area" style="display: flex; align-items: center; display: none;">
<div id="put_token_type" style="display: flex; align-items: center;">
  <!-- 按照 useTokenType 值決定是否在此容器產生 checkbox 選項-->
</div>
<label id="token_type_text" for="type-checkbox" style="margin-left: 8px;">
  <!-- 此區域您可放置 token_type_text 預設文字或是其他  -->
</label>
</div>

2. 配置 SDK 初始化參數

在 SDK 初始化配置中綁定記憶卡號與約定信用卡使用的核取方塊的 HTML 容器 id

const options = {
  ...
  elements: {
      CardNo: "put_card_no",
      CardExp: "put_card_exp",
      CardCvc: "put_card_cvc",
      CardTokenType: "put_token_type" // 新增此項
  },
  ...
};

3. onUpdate 事件處理

串接時若有傳送creditToken欲進行信用卡記憶卡號或約定信用卡交易時，onUpdate 回傳的 update.event 為 useTokenType，並可自 update.data取得相關設定值。

payuniSDK.onUpdate(function (update) {
    const { status, event, data } = update;
    // 表單狀態處理
    if (status) {
        // ... 表單驗證相關邏輯
        // 若使用者要使用記憶過的卡號進行交易，可忽略 CardNo 為 null 的驗證狀態

    }
    // 特定事件處理
    if (event === "useTokenType") {
        // 獲取事件時才顯示 checkbox 區域元件
        document.getElementById("token_type_checkbox_area").style.display = "flex"
        // 啟用記憶卡號，且已綁定成功後，SDK 會在第二次開始，透過 cardNo 回傳綁定要快速結帳的記憶卡號
        if (data.tokenType === "2" && data.cardNo !== null) {
          // 您可在此做相對應的畫面處理，例如在頁面顯示已綁定卡號並提供選取按鈕讓使用者自行決定是否使用此綁定卡號交易
        }
        setTimeout(() => {
          // 顯示 checkbox 的文案
          if (data.tokenTypeText) document.getElementById("token_type_text").innerHTML = data.tokenTypeText
        }, 100)
        return
    }
});


記憶卡號:

您可自行決定是否要顯示卡號輸入框讓使用者不使用記憶卡號而是重新輸入卡號，或是參考詳細範例
SDK 會取得核取方塊的值，判斷是否要記憶卡號，請確保初始化參數的CardTokenType有設定顯示核取方塊的容器 id
若您串接時設定記憶卡號包含到期日，則 SDK 會將到期日自動帶入 put_card_exp 輸入框
update.data回傳值
第一次使用creditToken啟用信用卡記憶卡號時
{
cardNo: null,
tokenTypeText: "記錄此張信用卡下次即可快速結帳",
tokenType: "2"
}

同組 creditToken 第二次開始進行信用卡記憶卡號快速交易
{
cardNo: "414712******2716", // 回傳經過隱碼的卡號
tokenTypeText: "記錄此張信用卡下次即可快速結帳", // 如果使用者要更新記憶卡號可搭配顯示選項文字
tokenType: "2"
}

約定信用卡/強制約定信用卡
在一般約定信用卡時，SDK 會取得核取方塊的值，判斷使用者是否同意使用約定信用卡交易，請確保初始化參數的CardTokenType有設定顯示核取方塊的容器 id
update.data回傳值
約定信用卡交易
{
  cardNo: null,
  tokenTypeText:"本次交易完成後，商店即可透過 PAYUNi 平台綁定信用卡以方便您日後付款，您的卡號將於 PAYUNI 平台加密存放，商店無法取得您的完整卡號，請安心交易。",
  tokenType: "1"
}

強制約定信用卡交易
使用強制約定時將不產生核取方塊，強制進行約定信用卡綁定，你可自行決定是否顯示tokenTypeText
{
cardNo: null,
tokenTypeText: "本次交易完成後，商店即可透過 PAYUNi 平台綁定信用卡以方便您日後付款，您的卡號將於 PAYUNI 平台加密存放，商店無法取得您的完整卡號，請安心交易。", 
tokenType: "3"
}

4. 使用信用卡記憶卡號交易

當使用 getTradeResult 時, 可以在帶入參數 config 加入 useDefault (boolean, 預設為 false)
當其值為true時, 並且useTokenType事件的 data 含有 cardNo 時, 就會使用原本快速記憶過的信用卡 (不會管CardNo的 input 值)。

  async function processPayment() {
    try {
      const result = await payuniSDK.getTradeResult({
        useDefault: true // 設置 true 為 要使用 記憶過的信用卡
      });
      console.log("取得信用卡號綁定 TOKEN 結果:", result);
      // 取得成功後再將原始的 TOKEN 進行幕後交易授權
    } catch (error) {
      console.error("信用卡號綁定 TOKEN 失敗:", error);
      // 建議於此處進行 Error Handle
    }
}

5. 取得記憶卡號或約定信用卡的核取方塊文字

您也可以單獨使用getTokenTypeText()取得記憶卡號或約定信用卡的核取方塊文字

  payuniSDK.getTokenTypeText(function (token_text) {
      document.getElementById("token_text").innerHTML = token_text
  });

API 參考
UniPayment 類別

初始化 SDK 的主要類別

名稱	非同步(async)	參數	回調參數	返回值	說明
createSession	N	token: String
initOption: Object	-	Object	建立 iframe 連線
SDK 實例方法

由 UniPayment.createSession() 返回的實例所提供的方法

名稱	非同步(async)	參數	回調參數	返回值	說明
start	Y	-	-	Promise<Object>	驗證 origin 或 token，並顯示輸入框在頁面上
onUpdate	N	callback: Function	update: Object	void	獲取使用者輸入表單的狀態即 SDK 的觸發事件
getTokenTypeText	N	-	-	String	當使用記憶卡號或約定信用卡時，可取得相關文案設置在核取方塊旁或是其他提示位置
getTradeResult	Y	config: Object	-	Object	進行交易並取得加密的交易結果
錯誤處理

請開啟瀏覽器的開發者模式(F12)查看 Console Error

當 SDK 接收參數與方法呼叫錯誤或提供錯誤或失效的 SDK token時會出現錯誤代碼
錯誤代碼請參考：錯誤代碼
未正確引用到 SDK, 請確認 script 網址是否正確
Uncaught ReferenceError: UniPayment is not defined





如需進一步支援或有任何問題，請聯繫 PAYUNi 技術支援團隊。
© 2025 PAYUNi Co., Ltd. All rights reserved.
```


## <a id="522"></a>免跳轉支付元件(UNi Embed) (7/522)

```
免跳轉支付元件(UNi Embed)
簡要描述

免跳轉元件提供給商店及代理商網站，使用iframe方式，嵌入支付元件進行付款作業，目前僅提供信用卡支付工具使用。

串接前請先進行前置作業的申請，並且依照本文件的步驟，進行免跳轉支付元件串接及參數設定。

串接前置作業
功能開通申請

一般商店：請於 PAYUNi 平台註冊會員，並且建立收款商店，取得商店代號 (MerID) 申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw

串接免跳轉元件前，會員必須提出申請，請聯繫客服或是商務人員，提出免跳轉元件申請並設定限定IP，開通後即可進行串接。

代理商：申請代理商合作資格並且與統一金流平台簽訂相關代理商合作業務契約，請於 PAYUNi 平台註冊會員，申請開通所免跳轉元件功能。相關申請文件可至申請書下載區下載。

環境要求
自 PAYUNi API 取得 SDK_TOKEN（有效期限 10 分鐘）
支援 JavaScript 的現代網頁瀏覽器
安全的 HTTPS 連線環境


支援交易類型
信用卡: 支援 Visa、MasterCard、JCB、銀聯卡
類型	備註
一次付清	包含國內卡、國外卡
分期付款	包含3期、6期、9期、12期、18期、24期、30期 (各銀行支援期數)
信用卡記憶卡號：可提供持卡人在付款時選擇是否記憶卡號與到期日，以利下次支付時於結帳頁面自動帶出卡號
信用卡Token
包含約定信用卡，及強制約定信用卡功能
首次交易時持卡人與商店進行信用卡 Token交易，並且完成信用卡約定，爾後商店使用該信用卡 Token，即可採用幕後方式進行該約定之授權交易
此功能可達到自訂排程，不定期不定額授權交易
使用此功能需先向 PAYUNi 平台申請審核開通且綁定 IP
後續信用卡Token交易請參考信用卡幕後Token交易
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
一次付清(模擬3D交易ECI值不符主動取消授權)：4147631000000002，3560511000000002
分期付款：3560562000000001，4147632000000001(不支援9期)，3560512000000001(不支援9期)
卡片到期日及背面末三碼可任意填入




免跳轉支付元件交易流程
免跳轉支付(3D)




免跳轉支付(非 3D)




取得 SDK TOKEN
進行交易前，須先透過 PAYUNi API 取得交易 TOKEN，使用時效為 10 分鐘
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/iframe/token_get

正式區：https://api.payuni.com.tw/api/iframe/token_get

※為配合國際組織與各收單銀行對網站 SSL 傳輸加密機制要求，敬請採用 TLS v1.2 以上協定。

請求方式
HTTP POST
請於 header 加入 user-agent，建議內容為payuni
串接金鑰
請登入 PAYUNi 平台檢視商店串接資訊取得 Hash Key 及 Hash IV。
如使用代理商金鑰串接時，請登入 PAYUNi 平台>代理商專區> 合約及基本資料，取得串接金鑰 Hash Key及 Hash IV。

如使用代理商金鑰串接時，需增加請求參數 IsPlatForm=1 且與 MerID Version EncryptInfo HashInfo 同層
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 2.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考 訂單金額限制說明　　
Timestamp	Y	int	時間戳記	格式: time()
ReturnURL	C	string	前景通知網址
付款完成返回指定網址(Form Post)
若空值，付款後呈現 PAYUNi 付款結果頁
交易結果請以NotifyURL為主	格式: 完整網址
IFrameDomain	Y	string	使用元件之限定網域名稱(Domain)	格式: 填入網域限https，網域名稱只能包含中文、a-z、0-9 和 – (連字號)。不能在標籤開頭或結尾指定連字號
範例：https://www.payuni.com.tw
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址	格式: 完整網址
僅限80與443 port
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
BuyerHash	C	string	買方會員已綁定 Hash
交易時帶入買方 Hash 可完成買方驗證及交易綁定	註：買方 Hash 經由 UPP 交易使用 BuyerToken 綁定後取得
CarrierType	Y,C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y,C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。
首次信用卡Token交易請求參數
Y=必要；C=選填
若有需要使用首次信用卡Token交易，在請求參數項目中需帶入以下三項參數。
信用卡 Token 類型包含：約定信用卡、強制約定信用卡、記憶記憶信用卡號及到期日
約定信用卡及強制約定信用卡完成後，可從 信用卡Token查詢(約定)(CREDIT) 查詢已約定的 CreditHash。
後續信用卡Token交易請參考信用卡幕後Token交易
參數
(EncryptInfo)	必要	類型	說明	備註
UseTokenType	C	int	信用卡 Token 類型
如需使用信用卡Token交易，此參數為必填	1=約定信用卡，至付款頁面時消費者可自行取消約定
2=記憶卡號功能，預設為記憶卡號+到期日
3=強制約定信用卡，消費者無法取消
CreditToken	C	string	信用卡Token
如有使用 UseTokenType 參數，此參數為必填。
付款人綁定資料使用，例：會員編號、Email、手機等	長度限制: 200
格式: [A-Z a-z 0-9 @.#$%_-]
CreditTokenType	C	int	信用卡 Token 紀錄類型，預設為會員。
會員:
會員旗下所有商店代號共用此Token
商店:
僅限於首次交易商店代號可使用此Token	1=會員
2=商店
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考
錯誤代碼
MerID	商店代號	　　
Version	版本	固定 2.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=取得Token成功
若失敗請參考 錯誤代碼
Message	狀態說明	成功=取得token成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-] 　　
TradeAmt	訂單金額	　　
Token	iframe 驗證參數	
TokenExpired	Token 逾期時間	超過10分鐘為逾期




串接 uniPayment Javascript SDK
SDK引入規範

僅可使用 PAYUNi 官方提供的 JavaScript SDK

SDK 位址：https://vendor.payuni.com.tw/sdk/uni-payment.js

安全性考量

禁止下載 uni-payment.js 至自有主機託管

因應 Content-Security-Policy，請將下列下列網域設定至 script-src, frame-src 中
正式環境: https://vendor.payuni.com.tw
測試環境: https://sandbox-vendor.payuni.com.tw

若有串接Ver 1.0 版本，可移除 v1.0 版的 https://api.payuni.com.tw ,https://sandbox-api.payuni.com.tw

基本設定
1. 引入 SDK 腳本
<script src="https://vendor.payuni.com.tw/sdk/uni-payment.js"></script>

2. 設置 HTML 元素
<div class="payment-form">
    <div class="form-group">
        <label>信用卡號碼</label>
        <div id="put_card_no"></div>
    </div>
    <div class="form-group">
        <label>有效期限</label>
            <div id="put_card_exp"></div>
    </div>
    <div class="form-group">
        <label>安全碼</label>
        <div id="put_card_cvc"></div>
    </div>
</div>

3. 配置 SDK
const options = {
    env: "P",  // P: 正式環境, S: 測試環境
    useInst: false, 
    elements: {
        CardNo: "put_card_no",
        CardExp: "put_card_exp",
        CardCvc: "put_card_cvc"
    },
    style: {
        color: "#000000",
        errorColor: "#FF0000",
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "24px"
    }
};

// SDK_TOKEN 由後端串接 PAYUNi API 所取得 
const payuniSDK = UniPayment.createSession(SDK_TOKEN, options);

參數	種類	說明	必填	預設
env	String	使用環境(P 為正式，S 為測試)	否	P
useInst	Boolean	是否使用分期	否	false
elements	Object	設定連動相關 div ID	是	如上範例
style	Object	設定預設的 input style	否	如上範例
4. 檢查連線並產生輸入元件

連線成功後將會在頁面上看到信用卡交易相關的輸入元件，若未正確顯示輸入元件請確認取得的錯誤訊息，並對照錯誤代碼表

async function startProcess() {
    try {
      let resp = await payuniSDK.start()
      console.log("連線成功:", resp);
    } catch (error) {
      console.error("連線失敗:", error);
      // 可以取得 error.message 作客製化錯誤處理, 範例如下:
      // if (error.message === "Code 1008") alert("iframe 連線超時(timeout), 請重新整理")
    }
}
//執行連線
startProcess()

來源驗證機制 (段落排版參考下圖)
免跳轉支付元件會檢查當前網站的來源 (origin) 是否與商店取得 Token 時的 IFrameDomain 一致，確保僅合法商店頁面能載入支付元件。
若使用者啟用了隱私權設定較嚴格的瀏覽模式（如 Safari 私密瀏覽），瀏覽器可能會隱藏來源資訊，導致無法進行驗證。
在無法驗證來源的情況下，系統不會中斷輸入流程，但會於信用卡號輸入框下方顯示警語，提醒使用者確認頁面來源。

事件處理

onUpdate 可取得使用者輸入表單的狀態方法或其他事件處理機制

payuniSDK.onUpdate(function (update) {
    const { status, event, data } = update;

    // 表單驗證狀態處理
    if (status) {
        // 從 status 取得元件的輸入狀態與驗證狀態
        // {
        //     "CardNo": null,
        //     "CardExp": true,
        //     "CardCvc": true
        // }

    }

    // 特定事件處理
    if (event === "useTokenType") {
        // ... 記憶卡號相關邏輯
    }
});

onUpdate 回調函數
屬性	類型	說明
callback	function(update: Object)	當有更新時被調用的回調函數
update.status	Object	輸入元件的輸入狀態
update.event	String	SDK 會出現的相關事件，對應相關 data
update.data	Object	因應事件會有的相關資料
status 類型
名稱	內容
update.status.CardNo	
true	欄位已填好，並且沒有問題
null	欄位還沒有填寫
false	欄位有錯誤，input view 的輸入框會顯示 errorColor 設定的顏色
typing	使用者正在輸入中

update.status.CardExp	
true	欄位已填好，並且沒有問題
null	欄位還沒有填寫
false	欄位有錯誤，input view 的輸入框會顯示 errorColor 設定的顏色
typing	使用者正在輸入中

update.status.CardCvc	
true	欄位已填好，並且沒有問題
null	欄位還沒有填寫
false	欄位有錯誤，input view 的輸入框會顯示 errorColor 設定的顏色
typing	使用者正在輸入中
event 類型
名稱	說明
useTokenType	當此交易會使用到記憶卡號/約定信用卡/強制約定信用卡時可取得此參數
data 類型

useTokenType相關:

名稱	說明
tokenType	本次交易是否啟用 '1' = 約定信用卡, '2' = 記憶卡號快速交易, '3' = 強制約定信用卡
tokenTypeText	checkbox 的說明文字, 可參考使用
cardNo	快速記憶的卡號 (tokenType = '2' 才會有, 第一次交易沒有卡號時, 則為 null)
交易流程

當使用者輸入完資料，並透過 onUpdate() 回傳的 status 皆為 true 時，即可使用 getTradeResult()方法執行交易流程。

1. 進行交易
// 基本一次付清
async function processPayment() {
    try {
      const result = await payuniSDK.getTradeResult();
      console.log("取得信用卡號綁定 TOKEN 結果:", result);
    } catch (error) {
      console.error("信用卡號綁定 TOKEN 失敗:", error);
      // 建議於此處進行 Error Handle
    }
}

// 進階配置範例:商店可使用的分期、記憶卡號資訊取得方式請參考進階功能
const paymentConfig = {    
    cardInst: 3,     // 分期期數
    useDefault: true, // 使用信用卡記憶卡號進行快速結帳
};
await payuniSDK.getTradeResult(paymentConfig);

// 單一功能配置範例
await payuniSDK.getTradeResult({ cardInst: 12 }); // 僅設定 12 期分期


配置參數說明：

屬性名稱	類型	說明	預設
cardInst	Number	要使用的分期期數；需先透過 getCardAcceptInfo() 取得可分期期期數	預設為: 1，有開啟分期付款才有效
useDefault	Boolean	使用記憶卡號交易，會忽略 CardNo 的輸入值	預設為: false ，當已啟用記憶卡號時應設為 true
2. 後續處理
非 3D 交易，取得交易結果後傳送至您的後端伺服器，將 EncryptInfo 解密後可取得詳細返回結果，欄位可參考 信用卡幕後API 返回參數 內容。
3D 交易結果請參考 免跳轉支付元件 3D 交易結果 Notify。
若有使用發票功能，版本固定為1.2；反之則為1.1。

getTradeResult() 回傳格式說明：

參數	說明
EncryptInfo	加密後的訊息
HashInfo	加密後的訊息
MerID	商店 ID
Status	狀態
Version	版本
SDK 自訂樣式

當 input 欄位處於 focus 狀態時，SDK 會自動加上 form-input-focus class。您可以透過自訂 CSS 來設定 focus 狀態的樣式：

  .form-input-focus {
    border-color: #ffffff;
    outline: 0;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px #0485ff73;
    box-shadow: 0px 0px 4px 0.1rem #0485ff73;
  }

進階功能
信用卡分期付款

使用 getCardAcceptInfo() 取得可用的分期期數發卡銀行。您需自行建立分期期數的選擇元素或是顯示可用分期資訊。

注意：需等待 payuniSDK.start() 完成後才能呼叫此方法。
try {
    // 取得分期相關資訊
    const info = await payuniSDK.getCardAcceptInfo();
    // 分期資訊範例
    // info.CreditInst = {
    //     "3": "中信、台新、國泰...",
    //     "6": "中信、台新、國泰...",
    //     "12": "中信、台新、國泰..."
    // }
} catch (error) {
    console.error("取得資訊失敗:", error);
}


回傳資料說明：

參數	類型	說明
CreditInst	Object	分期資訊，key 為期數，value 為支援銀行清單
記憶卡號、約定信用卡與強制約定信用卡
1. 設置 HTML 元素
使用記憶卡號和約定信用卡相關功能時，需要消費者勾選啟用與否，請預先設置產生核取方塊的 HTML 容器以及文案顯示位置
for="type-checkbox"的設置可讓使用者點擊文字時同時點擊核取方塊

為配合 payuniSDK.onUpdate 顯⽰，可先將 token_type_checkbox_area 設定隱藏

<div id="token_type_checkbox_area" style="display: flex; align-items: center; display: none;">
<div id="put_token_type" style="display: flex; align-items: center;">
  <!-- 按照 useTokenType 值決定是否在此容器產生 checkbox 選項-->
</div>
<label id="token_type_text" for="type-checkbox" style="margin-left: 8px;">
  <!-- 此區域您可放置 token_type_text 預設文字或是其他  -->
</label>
</div>

2. 配置 SDK 初始化參數

在 SDK 初始化配置中綁定記憶卡號與約定信用卡使用的核取方塊的 HTML 容器 id

const options = {
  ...
  elements: {
      CardNo: "put_card_no",
      CardExp: "put_card_exp",
      CardCvc: "put_card_cvc",
      CardTokenType: "put_token_type" // 新增此項
  },
  ...
};

3. onUpdate 事件處理

串接時若有傳送creditToken欲進行信用卡記憶卡號或約定信用卡交易時，onUpdate 回傳的 update.event 為 useTokenType，並可自 update.data取得相關設定值。

payuniSDK.onUpdate(function (update) {
    const { status, event, data } = update;
    // 表單狀態處理
    if (status) {
        // ... 表單驗證相關邏輯
        // 若使用者要使用記憶過的卡號進行交易，可忽略 CardNo 為 null 的驗證狀態

    }
    // 特定事件處理
    if (event === "useTokenType") {
        // 獲取事件時才顯示 checkbox 區域元件
        document.getElementById("token_type_checkbox_area").style.display = "flex"
        // 啟用記憶卡號，且已綁定成功後，SDK 會在第二次開始，透過 cardNo 回傳綁定要快速結帳的記憶卡號
        if (data.tokenType === "2" && data.cardNo !== null) {
          // 您可在此做相對應的畫面處理，例如在頁面顯示已綁定卡號並提供選取按鈕讓使用者自行決定是否使用此綁定卡號交易
        }
        setTimeout(() => {
          // 顯示 checkbox 的文案
          if (data.tokenTypeText) document.getElementById("token_type_text").innerHTML = data.tokenTypeText
        }, 100)
        return
    }
});


記憶卡號:

您可自行決定是否要顯示卡號輸入框讓使用者不使用記憶卡號而是重新輸入卡號，或是參考詳細範例
SDK 會取得核取方塊的值，判斷是否要記憶卡號，請確保初始化參數的CardTokenType有設定顯示核取方塊的容器 id
若您串接時設定記憶卡號包含到期日，則 SDK 會將到期日自動帶入 put_card_exp 輸入框
update.data回傳值
第一次使用creditToken啟用信用卡記憶卡號時
{
cardNo: null,
tokenTypeText: "記錄此張信用卡下次即可快速結帳",
tokenType: "2"
}

同組 creditToken 第二次開始進行信用卡記憶卡號快速交易
{
cardNo: "414712******2716", // 回傳經過隱碼的卡號
tokenTypeText: "記錄此張信用卡下次即可快速結帳", // 如果使用者要更新記憶卡號可搭配顯示選項文字
tokenType: "2"
}

約定信用卡/強制約定信用卡
在一般約定信用卡時，SDK 會取得核取方塊的值，判斷使用者是否同意使用約定信用卡交易，請確保初始化參數的CardTokenType有設定顯示核取方塊的容器 id
update.data回傳值
約定信用卡交易
{
  cardNo: null,
  tokenTypeText:"本次交易完成後，商店即可透過 PAYUNi 平台綁定信用卡以方便您日後付款，您的卡號將於 PAYUNI 平台加密存放，商店無法取得您的完整卡號，請安心交易。",
  tokenType: "1"
}

強制約定信用卡交易
使用強制約定時將不產生核取方塊，強制進行約定信用卡綁定，你可自行決定是否顯示tokenTypeText
{
cardNo: null,
tokenTypeText: "本次交易完成後，商店即可透過 PAYUNi 平台綁定信用卡以方便您日後付款，您的卡號將於 PAYUNI 平台加密存放，商店無法取得您的完整卡號，請安心交易。", 
tokenType: "3"
}

4. 使用信用卡記憶卡號交易

當使用 getTradeResult 時, 可以在帶入參數 config 加入 useDefault (boolean, 預設為 false)
當其值為true時, 並且useTokenType事件的 data 含有 cardNo 時, 就會使用原本快速記憶過的信用卡 (不會管CardNo的 input 值)。

  async function processPayment() {
    try {
      const result = await payuniSDK.getTradeResult({
        useDefault: true // 設置 true 為 要使用 記憶過的信用卡
      });
      console.log("取得加密後的交易結果:", result);
    } catch (error) {
      console.error("交易失敗:", error);
    }
}

5. 取得記憶卡號或約定信用卡的核取方塊文字

您也可以單獨使用getTokenTypeText()取得記憶卡號或約定信用卡的核取方塊文字

  payuniSDK.getTokenTypeText(function (token_text) {
      document.getElementById("token_text").innerHTML = token_text
  });

API 參考
UniPayment 類別

初始化 SDK 的主要類別

名稱	非同步(async)	參數	回調參數	返回值	說明
createSession	N	token: String
initOption: Object	-	Object	建立 iframe 連線
SDK 實例方法

由 UniPayment.createSession() 返回的實例所提供的方法

名稱	非同步(async)	參數	回調參數	返回值	說明
start	Y	-	-	Promise<Object>	驗證 origin 或 token，並顯示輸入框在頁面上
onUpdate	N	callback: Function	update: Object	void	獲取使用者輸入表單的狀態即 SDK 的觸發事件
getTokenTypeText	N	-	-	String	當使用記憶卡號或約定信用卡時，可取得相關文案設置在核取方塊旁或是其他提示位置
getTradeResult	Y	config: Object	-	Object	進行交易並取得加密的交易結果
錯誤處理

請開啟瀏覽器的開發者模式(F12)查看 Console Error

當 SDK 接收參數與方法呼叫錯誤或提供錯誤或失效的 SDK token時會出現錯誤代碼
錯誤代碼請參考：錯誤代碼
未正確引用到 SDK, 請確認 script 網址是否正確
Uncaught ReferenceError: UniPayment is not defined





如需進一步支援或有任何問題，請聯繫 PAYUNi 技術支援團隊。
© 2025 PAYUNi Co., Ltd. All rights reserved.
```


# 交易查詢 API


## <a id="164"></a>信用卡幕後Token交易(CREDIT) (7/164)

```
信用卡幕後Token交易(CREDIT)
簡要描述

PAYUNi平台提供信用卡幕後Token交易機制：

當商店與持卡人約定，持卡人同意交易完成後，商店即可透過 PAYUNi 平台綁定信用卡以方便持卡人日後付款(卡號將於 PAYUNi 平台加密存放，商店無法取得完整卡號)。
商店需先使用整合式支付頁 UNiPaypage (UPP)或信用卡免跳轉支付元件(UNi Embed)等交易建立API，請持卡人完成首次交易並同意建立此卡號的信用卡Token，交易成功後，商店會取得回傳該信用卡Token的CreditHash。
爾後商店只需使用該信用卡Token的CreditHash，透過此API即可進行與持卡人約定之信用卡授權交易。
須向PAYUNi提出申請，審核開通且綁定幕後授權IP即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
請於左方目錄相關文件及申請書下載，下載申請表單向PAYUNi提出信用卡Token機制申請與綁定IP，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
串接此API前，請確認先使用整合式支付頁 UNiPaypage (UPP)或信用卡免跳轉支付元件(UNi Embed)等交易建立API，完成首次交易並取得CreditHash。
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/credit

正式區：https://api.payuni.com.tw/api/credit

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.3
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
TradeAmt	Y	int	訂單金額	請參考 訂單金額限制說明　　
Timestamp	Y	int	時間戳記	格式: time()
CardInst	C	string	信用卡分期數	1=一次(預設)
3,6,9,12,18,24,30=分期數
NotifyURL	C	string	背景通知網址
將交易資料通知指定網址，僅於平台點選補觸發時，及收到回覆為UNKNOWN時後續通知交易結果使用	格式: 完整網址
僅限80與443 port
UsrMail	Y,C	string	消費者信箱	格式: 信箱格式
若有開啟物流功能時此欄必填，將視為物流收件人信箱
若有開啟電子發票功能且CarrierType=amego時，此欄位必填
ProdDesc	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述
CreditHash	C	string	信用卡 Hash	首次信用卡Token交易回傳的 CreditHash 值
API3D	C	int	幕後強制3D	1=強制3D

EnName	C	string	啟用信用卡3D交易時需輸入持卡人英文名稱，供發卡行驗證	格式: [ A-Za-z,-.空白]
ReturnURL	C	string	返回指定網址
僅於API3D=1時使用,於3D頁面完成後導回指定網址	格式: 完整網址
UserIP	C	string	消費者IP
若有帶入則會列入全平台風險管控機制，協助阻擋異常交易	格式: 支援IPv4 和 IPv6 格式
BuyerHash	C	string	買方會員Token Hash	帶入買方 Token Hash 可完成買方驗證及交易綁定於此買方會員
若商店啟用開放交易金額上限，且交易金額大於訂單金額限制時，此欄位為必填
買方 Token Hash取得方式：請先使用 整合式支付頁 UNiPaypage (UPP)帶入BuyerToken參數，消費者完成買方註冊或登入且交易完成後取得
CarrierType	Y,C	string	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y,C	string	載具內容	當 CarrierType 為3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編
CarrierType=amego時，此欄位免填
InvBuyerName	Y,C	string	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　

若有開啟物流功能時，使用信用卡幕後API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字 (請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定

備註：有帶ServiceType時，當作貨到不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
UNAPPROVED=訂單待確認，買家會員資格審查中
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.2
EncryptInfo	加密字串	請參考資料加解密
HashInfo	加密 Hash	請參考資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
UNAPPROVED=訂單待確認，買家會員資格審查中
若失敗請參考錯誤代碼
Message	狀態說明	授權成功=信用卡授權成功
若失敗請參考錯誤代碼
UNKNOWN=系統忙碌中，尚未確認交易結果
當60秒無收到銀行回應會先回覆UNKNOWN，後續若有取得交易結果會Notify至NotifyURL，或建議可於15分鐘後發動交易查詢確認交易狀態
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-] 　　
Gateway	交易標記	1=幕後
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	1=已付款
2=付款失敗
3=付款取消
8=訂單待確認
PaymentType	支付工具	1=信用卡
CardBank	發卡銀行(代碼)	若為國內發卡行則為銀行代碼(3碼)，若非國內發卡行則為”-“
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardInst	分期數	　　
FirstAmt	首期金額	　　
EachAmt	每期金額	　　
ResCode	回應碼	　　
ResCodeMsg	回應碼敘述	　　
AuthCode	授權碼	　　
AuthBank	授權銀行(代碼)	　　
AuthBankName	授權銀行(名稱)	　　
AuthType	授權類型	1=一次
2=分期
7=銀聯
AuthDay	授權日期	格式: YYYYMMDD
AuthTime	授權時間	格式: HHIISS
CreditHash	信用卡Token Hash	Token專用返回參數
有 CreditToken 且授權成功才會壓碼
CreditLife	信用卡Token 有效日期	格式: MMYY
CoBrandCode	聯名卡代號	聯名卡交易識別代號(需事先設定)
強制3D
(API3D=1)	說明	備註
Status	狀態代碼	SUCCESS=建立幕後3D成功
若失敗請參考錯誤代碼
Message	狀態說明	建立幕後3D成功
若失敗請參考錯誤代碼
URL	強制3D導頁網址	　　

若有開啟優惠劵功能時，使用優惠碼於幕後API
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用信用卡幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
StoreID	取件門市代碼	例如：916712　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
黑貓宅配取貨不付款
(ShipType=2)	說明	備註
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
```


## <a id="172"></a>交易查詢 (7/172)

```
交易查詢
簡要描述
串接前置作業
交易查詢流程
請求 URL
請求方式
串接金鑰
請求参数
返回參數
交易查詢
簡要描述
查詢交易可供查詢交易狀態，包含信用卡、ATM轉帳、超商代碼交易、icash Pay交易、AFTEE先享後付、Line Pay交易、超商取貨付款、黑貓宅配貨到付款、街口支付交易
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
交易查詢流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/query

正式區：https://api.payuni.com.tw/api/trade/query

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 2.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	C	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
與 TradeNo 擇一
TradeNo	C	string	UNi序號	與 MerTradeNo 擇一
Timestamp	Y	int	時間戳記	　　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 2.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
由於可能多筆紀錄，故回傳資料統一為 Result 陣列 (由 0 開始)
當建立訂單時有使用物流服務，回傳參數中將包含ShipTradeNo(UNi物流序號)
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
Message	狀態說明	查詢成功
若失敗請參考 錯誤代碼
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeFee	交易手續費	統一金流收取的手續費金額
TradeStatus	訂單狀態	0=取號成功
9=未付款
1=已付款
2=付款失敗
3=付款取消
4=交易逾期
8=訂單待確認
PaymentType	支付工具	1=信用卡
2=ATM轉帳
3=條碼/代碼
5=取貨付款(超商取貨付款)
6=愛金卡 (ICash)
7=後支付(Aftee)
8=退貨代收(C2B退貨便)
9=LINEPay
10=宅配到付
11=街口支付
PaymentDay	支付日期	格式: YYYY-MM-DD HH:II:SS
CreateDay	建立日期	格式: YYYY-MM-DD HH:II:SS
Gateway	閘道	1=單串
2=整合式支付頁 (UPP)
3=一頁式支付頁 (UOP)
DataSource	查詢結果狀態	A=完整資料
B=處理中未完整
建議當查詢結果狀態為B時，可於10分鐘後再次發動交易查詢
交易手續費TradeFee說明：
1.當DataSource=A且TradeStatus=1時，才有正確手續費資訊，否則為0
2.PaymentType=6(ICash)交易手續費非統一金流收取，故參數值為”-“，PaymentType=9(LINEPay)交易手續費為統一金流收取的交易處理費。
信用卡
(PaymentType=1)	說明	備註
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardExp	卡片到期日	格式: MMYY
CardInst	分期數	　　
AuthCode	授權碼	　　
AuthType	授權類型	1=一次
2=分期
3=紅利
4=Apple Pay
5=Google Pay
6=Samsung Pay
7=銀聯
(註：2025/09/01起不支援紅利交易)
CardBank	發卡銀行(代碼)	若為國內發卡行則為銀行代碼(3碼)，若非國內發卡行則為”-“
CloseStatus	請款狀態	1=請款申請中
2=請款成功
3=請款取消
7=請款處理中
9=未申請
CloseAmt	請款金額	　　
RefundType	退款類型	2=退款
3=預計退款　
RefundStatus	退款狀態	1=退款申請中
2=退款成功
3=退款取消
8=退款處理中　
RefundAmt	退款金額	　　
RefundDay	退款發動日期	格式: YYYY-MM-DD HH:II:SS　
RemainAmt	剩餘可退款金額	　　
CoBrandCode	聯名卡代號	聯名卡交易識別代號(需事先設定)
信用卡退款僅提供查詢最後一筆退款紀錄
預計退款說明：當發動退款時，若同一筆(UNi序號)交易尚有請款或退款處理中，此次退款會先記錄為預計退款，待前一次請款或退款處理完成後才轉為退款申請中
線下交易
(PaymentType=2,3,5,8,10)	說明	備註
OffChannel	取號通路別	請參考
銀行代碼(數字), 超商代碼(英文)
PaymentType=5,8，顯示SEVEN
PaymentType=10，顯示TCAT
OffPayChannel	實際繳費通路別	請參考
銀行代碼(數字), 超商代碼(英文)
PaymentType=5,8，顯示SEVEN
PaymentType=10，顯示-
OffPayNo	繳費代碼	PaymentType=5,顯示出貨單號
PaymentType=8,顯示退貨便編號
PaymentType=10，顯示-
其餘則顯示繳費代碼
OffExpireTime	繳費截止日期	格式: YYYY-MM-DD HH:II:SS
PaymentType=5,8，無繳費截止日期
愛金卡 (ICash)
(PaymentType=6)	說明	備註
Channel	選擇通路	固定回ICASH
PayChannel	付款通路	固定回ICASH 　　
PayNo	愛金卡序號	　　
後支付 (Aftee)
(PaymentType=7)	說明	備註
Channel	選擇通路	固定回AFTEE
PayChannel	付款通路	固定回AFTEE 　　
PayNo	後支付(Aftee)序號	　　
LINE Pay
(PaymentType=9)	說明	備註
Channel	選擇通路	固定回LINE
PayChannel	付款通路	固定回LINE 　　
PayNo	LINEPay交易號碼	　　
街口支付(JKoPay)
(PaymentType=11)	說明	備註
Channel	選擇通路	固定回JKoPay　
PayChannel	付款通路	固定回JKoPay 　　
PayNo	JKoPay交易號碼	　　
JKoStrCupAmt	店家街口券折抵	　　
JKoChannel	支付工具	account=儲值帳戶
bank=銀行帳戶
creditcard=信用卡
RemainAmt	剩餘可退款金額	　　
RefundLastDT	最後退款日期	　　

當該交易有使用優惠劵核銷
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	
```


# 信用卡相關操作 API (請退款/取消授權/Token查詢取消/分段請求)


## <a id="38"></a>多筆交易查詢 (7/38)

```
多筆交易查詢
簡要描述
查詢交易可供單次查詢多筆交易狀態，包含信用卡、ATM轉帳、超商代碼交易、icash Pay交易、AFTEE先享後付、Line Pay交易、超商取貨付款、黑貓宅配貨到付款
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
交易查詢流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/finite_query

正式區：https://api.payuni.com.tw/api/trade/finite_query

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
QueryType	Y	string	編號類型	1=商店自訂編號
2=uni交易序號
查詢資料:僅限查詢三個月內訂單
QueryNo	Y	string	編號	最多100筆
以逗號分隔 e.g. 1674006682603924996,1674006544051190875
Timestamp	Y	int	時間戳記	　　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
由於可能多筆紀錄，故回傳資料統一為 Result 陣列 (由 0 開始)
回傳格式為Json
當建立訂單時有使用物流服務，回傳參數中將包含ShipTradeNo(UNi物流序號)
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
Message	狀態說明	查詢成功
若失敗請參考 錯誤代碼
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
TradeFee	交易手續費	統一金流收取的手續費金額　
TradeStatus	訂單狀態	0=取號成功
9=未付款
1=已付款
2=付款失敗
3=付款取消
4=交易逾期
8=訂單待確認
PaymentType	支付工具	1=信用卡
2=ATM轉帳
3=條碼/代碼
5=取貨付款(超商取貨付款)
6=愛金卡 (ICash)
7=後支付(Aftee)
8=退貨代收(C2B退貨便)
9=LINE Pay
10=宅配到付
11=街口支付
PaymentDay	支付日期	格式: YYYY-MM-DD HH:II:SS
CreateDay	建立日期	格式: YYYY-MM-DD HH:II:SS
Gateway	閘道	1=單串
2=整合式支付頁 (UPP)
3=一頁式支付頁 (UOP)
DataSource	查詢結果狀態	A=完整資料
B=處理中未完整
建議當查詢結果狀態為B時，可於10分鐘後再次發動交易查詢
交易手續費TradeFee說明：
1.當DataSource=A且TradeStatus=1時，才有正確手續費資訊，否則為0
2.PaymentType=6(ICash)交易手續費非統一金流收取，故參數值為”-“，PaymentType=9(LINEPay)交易手續費為統一金流收取的交易處理費。
信用卡
(PaymentType=1)	說明	備註
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardExp	卡片到期日	格式: MMYY
CardInst	分期數	　　
AuthCode	授權碼	　　
AuthType	授權類型	1=一次
2=分期
3=紅利
4=Apple Pay
5=Google Pay
6=Samsung Pay
7=銀聯
(註：2025/09/01起不支援紅利交易)
CardBank	發卡銀行(代碼)	若為國內發卡行則為銀行代碼(3碼)，若非國內發卡行則為”-“
CloseStatus	請款狀態	1=請款申請中
2=請款成功
3=請款取消
7=請款處理中
9=未申請
CloseAmt	請款金額	　　
RefundType	退款類型	2=退款
3=預計退款　
RefundStatus	退款狀態	1=退款申請中
2=退款成功
3=退款取消
8=退款處理中　
RefundAmt	退款金額	　　
RefundDay	退款發動日期	格式: YYYY-MM-DD HH:II:SS　
RemainAmt	剩餘可退款金額	　　
信用卡退款僅提供查詢最後一筆退款紀錄
預計退款說明：當發動退款時，若同一筆(UNi序號)交易尚有請款或退款處理中，此次退款會先記錄為預計退款，待前一次請款或退款處理完成後才轉為退款申請中
線下交易
(PaymentType=2,3,5,8,10)	說明	備註
OffChannel	取號通路別	請參考
銀行代碼(數字), 超商代碼(英文)
PaymentType=5,8，顯示SEVEN
PaymentType=10，顯示TCAT
OffPayChannel	實際繳費通路別	請參考
銀行代碼(數字), 超商代碼(英文)
PaymentType=5,8，顯示SEVEN
PaymentType=10，顯示-
OffPayNo	繳費代碼	PaymentType=5,顯示出貨單號
PaymentType=8,顯示退貨便編號
PaymentType=10，顯示-
其餘則顯示繳費代碼
OffExpireTime	繳費截止日期	格式: YYYY-MM-DD HH:II:SS
PaymentType=5,8，無繳費截止日期
愛金卡 (ICash)
(PaymentType=6)	說明	備註
Channel	選擇通路
PayChannel	付款通路	　　
PayNo	愛金卡序號	　　
後支付 (Aftee)
(PaymentType=7)	說明	備註
Channel	選擇通路
PayChannel	付款通路	　　
PayNo	後支付(Aftee)序號	　　
LINE Pay
(PaymentType=9)	說明	備註
Channel	選擇通路	固定回LINE
PayChannel	付款通路	固定回LINE 　　
PayNo	LINE Pay交易號碼	　　
街口支付(JKoPay)
(PaymentType=11)	說明	備註
Channel	選擇通路	固定回JKoPay
PayChannel	付款通路	固定回JKoPay 　　
PayNo	JKoPay交易號碼	　　
JKoStrCupAmt	店家街口券折抵	　　
JKoChannel	支付工具	account=儲值帳戶
bank=銀行帳戶
creditcard=信用卡
RemainAmt	剩餘可退款金額	　　
RefundLastDT	最後退款日期	　　

當該交易有使用優惠劵核銷
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	
```


## <a id="39"></a>交易請退款(CREDIT) (7/39)

```
交易請退款(CREDIT)
簡要描述
信用卡交易請退款，信用卡已完成授權的交易，可透過此功能向銀行發動請款或退款訊息(平台預設為自動請款)
包含以下：
信用卡一次付清 (可全額請退款，部分請退款)
分期付款 (僅全額請退款)
銀聯卡交易 (僅全額請退款)
國外卡 (可全額請退款，部分請退款)
已授權之信用卡交易，可自行發動請款或由平台預設自行請款。
已請款之信用卡交易，若有取消訂單發生可發動退款。
請款天期限制：授權成功後需於3天內請款。(若逾期請款且遭收單機構或發卡機構不受理時，本公司不負付款之責。)
退款天期限制：請款完成後需於180天內退款。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
信用卡請退款交易流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/close

正式區：https://api.payuni.com.tw/api/trade/close

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	UNi序號	　
Timestamp	Y	int	時間戳記	格式: time()
CloseType	Y	int	關帳類型	1=請款
2=退款
-1=取消請款
-2=取消退款
TradeAmt	C	int	請退款金額
	請退款時為必填
返回參數
參數	說明	備註
Status	狀態代碼	請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考資料加解密
HashInfo	加密 Hash	請參考資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
Message	狀態說明	處理成功
若失敗請參考錯誤代碼
MerID	商店代號	　　
TradeNo	UNi序號	　　
CloseType	關帳類型	1=請款
2=退款
-1=取消請款
-2=取消退款
```


## <a id="40"></a>交易取消授權(CREDIT) (7/40)

```
交易取消授權(CREDIT)
簡要描述
信用卡交易取消授權，信用卡已完成授權的交易，尚未執行請款可透過此功能向銀行發動取消授權訊息
包含以下：
信用卡一次付清
分期付款
國外卡
已授權之信用卡交易，但尚未請款，若有取消訂單發生可自行發動取消授權。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
信用卡取消授權交易流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/cancel

正式區：https://api.payuni.com.tw/api/trade/cancel

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	UNi序號	　
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	AES加密字串	請參考資料加解密
HashInfo	SHA256加密字串	請參考資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	取消授權成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
TradeNo	UNi序號	　　
```


## <a id="41"></a>信用卡Token查詢(約定)(CREDIT) (7/41)

```
信用卡Token查詢(約定)(CREDIT)
簡要描述
已綁定之信用卡Token查詢 (約定)
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
信用卡Token查詢流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/credit_bind/query

正式區：https://api.payuni.com.tw/api/credit_bind/query

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
CreditToken / CreditHash，請擇一即可
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
CreditToken	C	string	信用卡 Token，付款人綁定資料使用，例：會員編號或Email手機等	長度限制: 200
格式: [A-Za-z0-9@.#$%_-]
CreditTokenType	C	int	信用卡 Token 紀錄類型	1=會員(預設)
2=商店
使用CreditToken查詢時，未帶此參數則預設為1
使用CreditHash查詢時，不須帶此參數
CreditHash	C	int	信用卡 Token Hash	長度限制: 64
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
由於可能多筆紀錄，故回傳資料統一為 Result 陣列 (由 0 開始)
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
Message	狀態說明	查詢成功
若失敗請參考 錯誤代碼
CreditHash	約定信用卡 Hash	　　
CreditToken	信用卡 Token	長度限制: 200
格式: [A-Za-z0-9@.#$%_-]
CreditTokenType	信用卡 Token 紀錄類型	1=會員
2=商店
CreditTokenExpired	Token 有效日期	格式: MMYY
CreditTokenStatus	Token 狀態	1=正常
3=刪除
4=逾期
Card6No	信用卡前六碼	　　
Card4No	信用卡後四碼	　　
CardExpiredDT	信用卡有效日期	格式: MMYY
```


## <a id="100"></a>信用卡Token取消(約定/記憶卡號)(CREDIT) (7/100)

```
信用卡Token取消(約定/記憶卡號)(CREDIT)
簡要描述
取消於平台綁定之信用卡Token (約定/記憶卡號)
取消綁定之信用卡Token流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/credit_bind/cancel
正式區：https://api.payuni.com.tw/api/credit_bind/cancel
請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
UseTokenType	Y	int	信用卡 Token 類型	1=綁定
2=記憶卡號
BindVal	Y	string	信用卡 Token 或
信用卡 Hash	1. 當 UseTokenType 為綁定時，請帶 CreditHash 進行取消。

2. 當 UseTokenType 為記憶卡號時，請帶 CreditToken 進行取消。　
CreditTokenType	C	int	信用卡 Token 紀錄類型	1=會員(預設)
2=商店
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
Message	狀態說明	取消成功
若失敗請參考錯誤代碼
```


# 交易確認/取消/退款 API (各支付工具)


## <a id="85"></a>分段請求 (7/85)

```
分段請求
簡要描述
PAYUNi平台提供分段請求API，當收到透過分段請求API傳送之交易資料時，PAYUNi會先進行第一段回覆：訊息已接收，後續再進行交易請求處理，並於交易實際處理完成後回覆第二段處理結果Notify。
目前支援分段請求之API如下：
信用卡幕後
虛擬帳號幕後
超商代碼幕後
交易查詢
交易請退款
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
分段請求流程
若傳遞分段請求，則先進行第一段回覆SUCCESS訊息已接收,後續再進行交易請求處理及回覆第二段處理結果Notify，其餘流程皆同原API。
範例：分段請求-信用卡幕後(非3D)流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/async

正式區：https://api.payuni.com.tw/api/async

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考執行API之EncryptInfo
HashInfo	Y	string	SHA256加密字串	請參考執行API之HashInfo
APIURL	Y	string	執行API類別	credit=信用卡幕後
atm=虛擬帳號幕後
cvs=超商代碼幕後
trade_query=交易查詢
trade_close=交易請退款

NotifyURL	Y	string	背景通知網址	第二段回覆內容同原執行API的Notify data
註：若原執行API已有Notify機制，則仍會收到原執行API的Notify data
僅限80與443 port

EncryptInfo請參考執行API之EncryptInfo

返回參數
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
Message	狀態說明	訊息已接收=接收資料成功，待處理
```


## <a id="333"></a>後支付確認(AFTEE) (7/333)

```
後支付確認(AFTEE)
簡要描述
afteePay交易確認，可透過此功能向AFTEE發動確認訊息
AFTEE確認交易流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/common/confirm/aftee

正式區：https://api.payuni.com.tw/api/trade/common/confirm/aftee

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	UNi序號	　
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	處理成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
TradeNo	UNi序號	　　
TradeAmt	訂單金額	　　
ConfirmDT	確認日期	格式: YYYY-MM-DD HH:II:SS
```


## <a id="72"></a>交易取消超商代碼(CVS) (7/72)

```
交易取消超商代碼(CVS)
簡要描述
已完成超商代碼取號，但尚未使用多媒體事務機列印繳費單，則可透過此功能發動取消代號訊息。
若在商店發動取消代號前，消費者已經完成使用多媒體事務機列印繳費單，則該筆代碼仍可繳費成功。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
交易取消超商代碼流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/cancel_cvs

正式區：https://api.payuni.com.tw/api/cancel_cvs

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區超商代碼繳費付款完成測試
如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
Timestamp	Y	int	時間戳記	格式: time()
PayNo	Y	string	超商代碼	8碼或12碼的長度　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=取消超商代碼成功
若失敗請參考 錯誤代碼
Message	狀態說明	SUCCESS=取消超商代碼成功
若失敗請參考 錯誤代碼　
MerID	商店代號	　　
TradeAmt	訂單金額	　　
PayNo	超商代碼	取消成功會回8碼　　
VerifyCode	驗證碼	取消成功會回4碼　　
PaymentType	支付方式	固定3　　

取消成功的EncryptInfo解密範例：
Status=SUCCESS&Message=%E5%8F%96%E6%B6%88%E8%B6%85%E5%95%86%E4%BB%A3%E7%A2%BC%E6%88%90%E5%8A%9F&MerID=U01514169&TradeAmt=3655&PayNo=25124481&VerifyCode=2326&PaymentType=3
```


## <a id="84"></a>愛金卡退款(ICASH) (7/84)

```
愛金卡退款(ICASH)
簡要描述
icashPay交易退款(僅全額退款)，可透過此功能向icash Pay發動退款訊息
icashPay退款交易流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/common/refund/icash

正式區：https://api.payuni.com.tw/api/trade/common/refund/icash

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	UNi序號	　
TradeAmt	Y	int	退款金額	
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	處理成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
TradeNo	UNi序號	　　
RefundNo	退款序號	　　
RefundDT	退款日期	格式: YYYY-MM-DD HH:II:SS
```


## <a id="300"></a>後支付退款(AFTEE) (7/300)

```
後支付退款(AFTEE)
簡要描述
AFTEE退款交易流程
請求 URL
請求方式
串接金鑰
請求参数
返回參數
後支付退款(AFTEE)
簡要描述
afteePay交易退款(全額或部分退款)，可透過此功能向aftee Pay發動退款訊息
AFTEE退款交易流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/common/refund/aftee

正式區：https://api.payuni.com.tw/api/trade/common/refund/aftee

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	UNi序號	　
TradeAmt	Y	int	退款金額	
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	處理成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
TradeNo	UNi序號	　　
RefundNo	退款序號	　　
RefundDT	退款日期	格式: YYYY-MM-DD HH:II:SS
```


## <a id="377"></a>LINE Pay退款 (7/377)

```
LINE Pay退款
簡要描述
LINE Pay交易退款(全額或部分退款)，可透過此功能向LINE Pay發動退款訊息
LINE Pay退款交易流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/common/refund/linepay

正式區：https://api.payuni.com.tw/api/trade/common/refund/linepay

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	UNi序號	　
TradeAmt	Y	int	退款金額	
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	處理成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
TradeNo	UNi序號	　　
RefundNo	退款序號	　　
RefundDT	退款日期	格式: YYYY-MM-DD HH:II:SS
```


# 非信用卡退款轉匯 API


## <a id="76"></a>街口支付退款 (7/76)

```
街口支付退款
簡要描述
街口支付交易退款(全額或部分退款)，可透過此功能向街口支付發動退款訊息
街口支付退款交易流程
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/common/refund/jkopay

正式區：https://api.payuni.com.tw/api/trade/common/refund/jkopay

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	UNi序號	　
TradeAmt	Y	int	退款金額	
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	處理成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
TradeNo	UNi序號	　　
RefundNo	退款序號	　　
RefundDT	退款日期	格式: YYYY-MM-DD HH:II:SS
```


## <a id="77"></a>非信用卡退款轉匯(請求交易) (7/77)

```
非信用卡退款轉匯(請求交易)
簡要描述
PAYUNi平台提供非信用卡支付方式的退款功能，僅支援部分支付方式，請參考下方支付方式參數。
退款天期限制：付款完成後需於180天內退款。
商店發動退款後，PAYUNi會於隔日進行商店UNi帳戶扣款及匯款至商店提供的買方銀行帳號，約2~3個工作天到帳。
買方身分證號或統編需與銀行留存的帳號持有人相同。
發動退款當日可執行取消退款，隔日則不可取消退款。
若正向交易尚未撥款入帳，則會於退款發動日隔日主動撥款。
會員須向PAYUNi提出申請，審核開通且綁定幕後IP即可使用。
提醒您此服務需額外收取轉帳退款手續費，詳見官網費用一覽說明。
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/offline/refund

正式區：https://api.payuni.com.tw/api/trade/offline/refund

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區測試說明
測試區為方便測試，會於發動後立即執行UNi帳戶扣款及模擬匯款處理完成。(此與正式環境實際處理時間不同，正式環境請參考上方簡要描述)
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	加密 Hash	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	Uni序號	
Timestamp	Y	int	時間戳記	格式: time()
PaymentType	Y	int	支付方式	2=ATM轉帳
3=超商代碼
RefundAmt	Y	int	退款金額	退款金額須在訂單金額之內　
BankCode	Y	string	轉入銀行代碼	3碼銀行代碼
BankSubCode	Y	string	轉入銀行分行代碼	4碼分行代碼
BankAccountNo	Y	string	轉入銀行帳戶號碼	
UID	Y	string	轉入銀行帳號之身分證字號或是統編	　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=退款轉匯請求接收成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	SUCCESS=退款轉匯請求接收成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	
TradeNo	UNi序號	　　
RefundAmt	退款金額	　　
PaymentType	支付工具	2=ATM轉帳
3=超商代碼
EstimatedRefundDate	UNi帳戶扣款日期	例：2023-07-20
若失敗則固定回 0000-00-00　
退款轉匯結果Notify
退款轉匯實際匯出結果，將Notify至原交易所指定之NotifyURL
參數	說明	備註
MerID	商店代號	　　
Version	版本	依原交易版本號
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=退款轉匯處理成功
FAIL=退款轉匯失敗
Message	狀態說明	SUCCESS=退款轉匯處理成功
FAIL=退款轉匯失敗
MerID	商店代號	　　
MerTradeNo	商店訂單編號	
TradeNo	UNi序號	　　
RefundAmt	退款金額	　　
PaymentType	支付工具	2=ATM轉帳
3=超商代碼
RefundStatus	退款轉匯結果	1=轉匯成功
2=轉匯失敗　
BankDate	實際到帳日	例：2023-07-20
若失敗則為 -　
```


## <a id="381"></a>非信用卡退款轉匯取消 (7/381)

```
非信用卡退款轉匯取消
簡要描述
若發動非信用卡退款轉匯後，因故須進行取消，可利用此API發動退款取消。
發動退款當日可執行取消退款，隔日則不可取消退款。
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/offline/cancel_refund

正式區：https://api.payuni.com.tw/api/trade/offline/cancel_refund

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	加密字串	請參考 請參考
資料加解密
資料加密陣列
HashInfo	Y	string	加密 Hash	請參考 請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	Uni序號	須為已請求退款且尚
未處理轉匯的訂單
Timestamp	Y	int	時間戳記	格式: time()
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=退款轉匯取消處理成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	SUCCESS=退款轉匯取消處理成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	
TradeNo	UNi序號	　　
CancelAmt	取消退款的金額	　　
PaymentType	支付工具	2=ATM轉帳；3=超商代碼
```


# 撥款提領查詢 API


## <a id="219"></a>非信用卡退款轉匯(請求頁面) (7/219)

```
非信用卡退款轉匯(請求頁面)
簡要描述
PAYUNi平台提供非信用卡支付方式的退款功能，僅支援部分支付方式，請參考下方支付方式參數。
退款天期限制：付款完成後需於180天內退款。
買方退款發動後，PAYUNi會於隔日進行商店UNi帳戶扣款及匯款至商店提供的買方銀行帳號，約2~3個工作天到帳。
買方身分證號或統編需與銀行留存的帳號持有人相同。
發動退款當日商店可執行取消退款，隔日則不可取消退款。
若正向交易尚未撥款入帳，則會於買方退款發動日隔日主動撥款。
執行請求非信用卡退款轉匯頁結果，將Notify至原交易所指定之NotifyURL。
會員須向PAYUNi提出申請，審核開通且綁定幕後IP即可使用。
提醒您此服務需額外收取轉帳退款手續費，詳見官網費用一覽說明。
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/offline_payment/refund

正式區：https://api.payuni.com.tw/api/offline_payment/refund

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區測試說明
測試區為方便測試，會於發動後立即執行UNi帳戶扣款及模擬匯款處理完成。(此與正式環境實際處理時間不同，正式環境請參考上方簡要描述)
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	加密 Hash	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
TradeNo	Y	string	Uni序號	
Timestamp	Y	int	時間戳記	格式: time()
PaymentType	Y	int	支付方式	2=ATM轉帳
3=超商代碼
RefundAmt	Y	int	退款金額	退款金額須在訂單金額之內　
ReturnURL	C	string	完成後返回指定網址
若空值則呈現結果頁	格式: 完整網址
僅限80與443 port
BackURL	C	string	返回商店按鈕網址
點擊後返回指定網址	格式: 完整網址
僅限80與443 port
返回參數
系統將依訂單建立時所帶的 notifyURL 傳送退款轉匯結果Notify（若有 returnURL，內容相同）。
參數	說明	備註
Status	狀態代碼	SUCCESS=退款轉匯請求接收成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	SUCCESS=退款轉匯請求接收成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	
TradeNo	UNi序號	　　
RefundAmt	退款金額	　　
PaymentType	支付工具	2=ATM轉帳
3=超商代碼
EstimatedRefundDate	UNi帳戶扣款日期	例：2023-07-20
若失敗則固定回 0000-00-00　
退款轉匯結果Notify
退款轉匯實際匯出結果，將Notify至原交易所指定之NotifyURL
參數	說明	備註
MerID	商店代號	　　
Version	版本	依原交易版本號
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=退款轉匯處理成功
FAIL=退款轉匯失敗
Message	狀態說明	SUCCESS=退款轉匯處理成功
FAIL=退款轉匯失敗
MerID	商店代號	　　
MerTradeNo	商店訂單編號	
TradeNo	UNi序號	　　
RefundAmt	退款金額	　　
PaymentType	支付工具	2=ATM轉帳
3=超商代碼
RefundStatus	退款轉匯結果	1=轉匯成功
2=轉匯失敗　
BankDate	實際到帳日	例：2023-07-20
若失敗則為 -　
```


## <a id="231"></a>提領查詢 (7/231)

```
提領查詢
簡要描述
提領查詢可供商店查詢單日所有提領明細。
僅限提領模式為商店提領者適用，使用商店代號，查詢單一商店的提領明細。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
交易查詢流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/trade/withdraw_query

正式區：https://api.payuni.com.tw/api/trade/withdraw_query

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
QueryDate	Y	string	日期	格式:YYYY-MM-DD
查詢資料:僅限查詢30天內資料
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
由於可能多筆紀錄，故回傳資料統一為 Result 陣列 (由 0 開始)
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
Message	狀態說明	查詢成功
若失敗請參考 錯誤代碼
WithdrawDate	日期	
ProcessNo	處理序號	
MerID	商店代號	
MerName	商店名稱	
WithdrawType	執行方式	出帳或入帳
WithdrawInfo	項目	
Amt	本次異動金額	
Fee	費用	
WithdrawStatus	狀態	
BankDate	實際到帳日	若沒有值為-
BankErrMsg	失敗原因	若沒有值為-
```


# 物流工具 API (7-ELEVEN 超商 / 黑貓宅配)


## <a id="129"></a>物流單修改(背景) (7/129)

```
物流單修改(背景)
簡要描述
提供尚未列印出貨單的物流訂單修改物流資訊，包含：收貨人姓名、收貨人電子信箱、收貨人手機號碼
僅支援物流單修改，退貨便與黑貓退貨單不支援
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：7-ELEVEN超商常溫/冷凍取貨、黑貓宅配常溫/低溫取貨
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/logistics/update

正式區：https://api.payuni.com.tw/api/logistics/update

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

※※請注意此修改API需升至1.1版。
請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.1
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
LgsType	Y	String	物流型態	B2C=超商大宗寄倉
C2C=超商店到店
HOME=黑貓宅配
ShipTradeNo	C	String	UNi物流序號	
Consignee	C	String	收件人姓名	選填修改
超商限制長度：10
(最長5個中文字、最短至少2個中文字或4個英文字)
宅配限制長度：30
(中、英文與數字均可支援
每個英文字母長度算一位，每個中文字或全形字符均算兩位)
ConsigneeMail	C	String	收件人電子信箱	選填修改
僅超商物流有此欄位更新
需符合Email格式
ConsigneeMobile	C	String	收件人手機號碼	選填修改
限填手機號碼09開頭，半形數字
ConsigneeAddress	C	String	收件人地址	選填修改
僅黑貓宅配有此欄位更新
限制長度：120
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
返回參數
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.1
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	String	狀態說明	顯示原因
MerID	String	商店代號	　　
LgsType	String	物流型態	B2C=超商大宗寄倉
C2C=超商店到店
HOME=黑貓宅配
ShipTradeNo	String	UNi物流序號	　
Consignee	String	修改後收件人姓名	如有提交修改才會有此參數
ConsigneeMobile	String	修改後收件人手機號碼	如有提交修改才會有此參數
OriginalConsignee	String	修改前收件人姓名	如有提交修改才會有此參數
OriginalConsigneeMobile	String	修改前收件人手機號碼	如有提交修改才會有此參數
超商物流
(LgsType=B2C/C2C)	類型	說明	備註
ConsigneeMail	String	修改後收件人電子信箱	如有提交修改才會有此參數
OriginalConsigneeMail	String	修改前收件人電子信箱	如有提交修改才會有此參數
黑貓宅配
(LgsType=HOME)	類型	說明	備註
ConsigneeAddress	String	修改後收件人地址	如有提交修改才會有此參數
OriginalConsigneeAddress	String	修改前收件人地址	如有提交修改才會有此參數
```


## <a id="124"></a>物流單查詢 (7/124)

```
物流單查詢
簡要描述
供查詢物流狀態，包含：7-ELEVEN超商、黑貓宅配寄取貨(常溫、冷凍、冷藏)
透過7-ELEVEN配送物流單可於數網查件網站查詢配送編號的貨態：https://tracking.shopmore.com.tw/
透過黑貓宅配配送物流單可於黑貓宅配包裹查詢頁面查看配送編號的貨態：https://www.t-cat.com.tw/inquire/trace.aspx
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：7-ELEVEN超商常溫/冷凍取貨、黑貓宅配常溫/低溫取貨
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
物流查詢流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/logistics/query

正式區：https://api.payuni.com.tw/api/logistics/query

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

※請注意此查詢API需升至1.1版。
請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.1
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
LgsType	Y	String	物流型態	B2C=超商大宗寄倉
C2C=超商店到店
HOME=黑貓宅配
C2B=超商退貨便
ShipTradeNo	C	String	UNi物流序號	物流型態代入B2C/C2C/HOME時需填寫
TradeType	C	Int	宅配類別	(僅限宅配查詢使用)
1=正物流
2=逆物流
LgsType帶HOME而此參數未帶值時，將直接帶入預設值1=正物流
ReturnOdno	C	String	退貨便編號	物流型態代入C2B時需填寫
提供12碼退貨便編號
(8碼退貨便單號+4碼驗證碼)
備註：ShipTradeNo 與 ReturnOdno 參數需二擇一填寫
返回參數
參數	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.1
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
請求時選擇帶ShipTradeNo條件的回傳
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	String	狀態說明	顯示原因
MerID	String	商店代號	　　
PartnerId	String	母代碼	(若是黑貓宅配則固定回CAT)
MerTradeNo	String	自訂編號	限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複

TradeNo	String	UNi序號	　　
ShipTradeNo	String	UNi物流序號	　
Odno	String	出貨單編號/宅配託運單號	超商出貨單編號均為8碼
宅配託運單號為12碼
GoodsType	Int	寄件型態	1=常溫，2=冷凍，3=冷藏
LgsType	String	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配
ShipType	Int	通路類別	1=7-ELEVEN, 2=黑貓宅配
ServiceType	Int	取件方式	1=取貨付款，3=取貨不付款
ShipAmt	Int	取貨付款金額	代收金額
Consignee	String	收件人	隱碼顯示，例如：周*宇
ConsigneeMobile	String	收件人手機號碼	隱碼顯示
例如：09＊＊＊＊＊123
ShipStatus	Int	物流貨態狀態碼	詳閱物流貨態狀態碼
PickupStoreType	Int	取貨門市類型	物流貨態狀態碼81-門市關轉，會提供此參數區分關轉門市類型 1=取件門市 ，2=退件門市
ShipStatusDesc	String	貨態說明	
ShipStatusTime	Datetime	貨態日期	顯示最新貨態的更新日期時間
格式: YYYY-MM-DD HH:II:SS
大宗寄倉
(LgsType=B2C)	類型	說明	備註
StoreID	String	取件門市代碼	
StoreName	String	取件門市名稱	

店到店
(LgsType=C2C)	類型	說明	備註
ValidationNo	String	驗證碼	驗證碼為4碼
StoreID	String	取件門市代碼	
StoreName	String	取件門市名稱	

黑貓宅配
(LgsType=HOME)	類型	說明	備註
FileNo	String	檔名序號	用以重新下載託運單PDF檔
(FileNo的有效期限為取號後24小時內)
TradeType	Int	宅配類別	1=正物流
2=逆物流
ConsigneeAddress	String	收件人地址	

請求時選擇帶ReturnOdno條件的回傳
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　　
Message	String	狀態說明	顯示原因
MerID	String	商店代號	　　
PartnerId	String	母代碼	3碼
RefundODNO	String	退貨便編號	8碼
ValidationNo	String	退貨便驗證碼	4碼
LgsType	String	物流型態	C2B=退貨便
退貨便不支援店到店服務
ShipType	Int	通路類別	1=7-ELEVEN
ServiceType	Int	退貨付款方式	4=退貨付款，5=退貨不付款
TradeAmt	Int	訂單價值金額	
ShipAmt	Int	退貨付款金額	代收金額
DeadlineDate	Date	繳費期限	格式：YYYY-MM-DD HH:II:SS
ShipStatus	Int	物流貨態狀態碼	詳閱物流貨態狀態碼
ShipStatusDesc	String	貨態說明	
ShipStatusTime	Datetime	貨態日期	顯示最新貨態的更新日期時間
格式: YYYY-MM-DD HH:II:SS
備註：
(1) 7-ELEVEN B2C大宗寄倉出貨編號查詢：PartnerId(3碼)+Odno(8碼)=11碼
(2) 7-ELEVEN C2C店到店出貨編號查詢：Odno(8碼)+ValidationNo(4碼)=12碼
(3) 7-ELEVEN C2B退貨便退貨編號查詢：RefundODNO(8碼)+ValidationNo(4碼)=12碼
超商物流貨態查詢系統
```


## <a id="122"></a>建立超商物流單 (7/122)

```
建立超商物流單
簡要描述
PAYUNi平台提供物流服務並整合所有支付方式，會員可透過平台以最快速的串接方式，提供會員便捷的商品出貨服務，滿足消費者多元取貨及各支付方式的需求。
本文件主要說明物流工具串接方式，與各種物流交易流程。
當物流工具為超商取貨且消費者選擇取貨付款時，需建立物流取貨付款單。
提供純建立物流工具為超商取貨不付款，不綁PAYUNi金流服務。
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：7-ELEVEN超商常溫/冷凍取貨(大宗寄倉B2C)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
物流項目
消費者訂購商品完成後，會員即可進行備貨動作。
物流項目	支援與說明
7-ELEVEN超商
大宗寄倉B2C	1.適合出貨量大的賣家，將包裹寄送到超商指定物流中心。
2.需透過PAYUNi平台申請審核開通帳號(此物流工具僅商業會員可使用)
3.提供冷凍及常溫寄件服務。
4.數網查件網站，最多可同時查詢六筆配送編號的貨態：https://tracking.shopmore.com.tw/
7-ELEVEN超商
退貨便C2B	1.取得退貨便編號提供消費者至超商門市使用，將包裹寄回物流中心。
2.開通B2C大宗寄倉物流功能即開啟C2B退貨便功能(此物流工具僅商業會員可使用)
3.僅提供常溫寄件服務。
4.數網查件網站，最多可同時查詢六筆配送編號的貨態：https://tracking.shopmore.com.tw/
7-ELEVEN超商
店到店C2C	1.提供超商門市寄貨服務，至7-11超商門市櫃台寄送。
2.透過PAYUNi後台取得交貨便編號進行出貨單列印，亦可至超商門市ibon取得出貨單。
3.需透過PAYUNi平台申請審核開通帳號(此物流工具商業及個人會員皆使用)
4.提供冷凍及常溫寄件服務。
5.數網查件網站，最多可同時查詢六筆配送編號的貨態：https://tracking.shopmore.com.tw/
B2C 大宗寄倉

開通物流功能


商家出貨 - 消費者取貨流程


C2C 店到店
開通物流功能


商家出貨 - 消費者取貨流程



商家出貨 - 消費者未取貨，包裹退回退貨門市


請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/logistics/trade

正式區：https://api.payuni.com.tw/api/logistics/trade

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
各API統一規格：商店→系統
Y=必要；C=選填
若未帶任何支付工具參數，則依據後台之開啟項目決定付款頁面啟用項目
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.3
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
MerTradeNo	Y	String	商店訂單編號	限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複

GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍
LgsType	Y	String	物流型態	B2C=大宗寄倉
C2C=店到店
ShipType	Y	Int	通路類別	1=7-ELEVEN
TradeAmt	Y	Int	訂單金額	等於取貨付款金額，上限為20,000元
若ServiceType=3，則TradeAmt為商品價值
ServiceType	Y	Int	取件方式	1=取貨付款，3=取貨不付款
StoreID	Y	String	取件門市代碼	限制長度：6
例如：916712
Consignee	Y	String	取件人姓名	限制長度：10
最長5個中文字、最短至少2個中文字或4個英文字(請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMail	C	String	取件人電子信箱	需符合Email格式
ConsigneeMobile	Y	String	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)
RefundStoreID	C	String	指定退貨門市	僅支援C2C物流型態
SenderName	C	String	指定退貨收件人	僅支援C2C物流型態
等同寄件人
限制長度:10 最長5個中文字、 (請填寫真實姓名，超商取件時核對身分使用)
SenderMobile	C	String	指定退貨收件人手機號碼	僅支援C2C物流型態
等同寄件人手機號碼
限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹退貨到店通知與超商取件時核對身分使用)
NotifyURL	C	String	取貨付款完成取件通知URL	若有填寫此參數，且訂單取件方式為1=取貨付款，則消費者收到取貨付款包裹並完成取件時，會發送Notify至此處填寫的URL。
僅限80與443 port
CarrierType	Y/C	String	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y/C	String	載具內容	當 CarrierType 為 3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編

InvBuyerName	Y/C	String	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。
ProdDesc	Y/C	String	產品說明	當 CarrierType 有帶參數時，此欄位必填。
長度限制: 500
格式: 可透過半形分號(;)帶入多個敘述。
UsrMail	Y/C	String	消費者電子信箱	當 CarrierType 有帶參數時，此欄位必填。
CarrierType=amego時，UsrMail需填電子信箱

備註：
1.) 若為取貨不付款，則TradeAmt的訂單金額等同商品價值(當產生遺失賠償款時，將依據該商品價值進行賠償金額認賠依據，認賠金額需由超商認定)
2.) 針對C2C物流單，如果未填寫RefundStoreID，則會自動帶入商店開通C2C物流時所填寫的退貨門市代碼
3.) 針對C2C物流單，如果有填寫SenderName，則SenderMobile也必須填寫，不可為空；反之如果有填寫SenderMobile，則SenderName也必須填寫，不可為空。如果SenderName與SenderMobile均未填寫，則會自動帶入商店開通C2C物流時所填寫的退貨收件人與收件人資料

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　
返回參數
各API統一規格：系統→商店
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.3
EncryptInfo	String	加密字串	請參考資料加解密
HashInfo	String	加密 Hash	請參考資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	String	狀態說明	顯示原因
MerID	String	商店代號	　　
MerTradeNo	String	自訂編號	限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複

TradeNo	String	UNi序號	　　
TradeAmt	Int	訂單金額	　　
TradeStatus	Int	訂單付款狀態	固定=0
PaymentType	Int	支付方式	5=取貨付款
若ServiceType=3，則PaymentType固定為0　
PartnerId	String	母代碼	
GoodsType	Int	寄件型態	1=常溫，2=冷凍
LgsType	String	物流型態	B2C=大宗寄倉
C2C=店到店
ShipType	Int	通路類別	1=7-ELEVEN
ShipTradeNo	String	UNi物流序號	
ShipAmt	Int	取貨付款金額	
StoreID	String	取件門市代碼	
StoreName	String	取件門市名稱	
StoreAddr	String	取件門市地址	
Consignee	String	收件人名稱	限制長度：10
最長5個中文字、最短至少2個中文字或4個英文字(請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	String	收件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)
ConsigneeMail	String	收件人電子信箱	
RefundStoreID	String	指定退貨門市	僅請求時有填寫RefundStoreID時才會回傳此
參數
RefundStoreName	String	指定退貨門市名稱	僅請求時有填寫RefundStoreID時才會回傳此
參數
RefundStoreAddr	String	指定退貨門市地址	僅請求時有填寫RefundStoreID時才會回傳此
參數
SenderName	String	指定退貨收件人	僅請求時有填寫SenderName與SenderMobile
時才會回傳此參數
SenderMobile	String	指定退貨收件人手機號碼	僅請求時有填寫SenderName與SenderMobile
時才會回傳此參數
Notify參考格式 : 取件通知API (背景) PAYUNi→Merchant

此為取貨付款時會發的Notify通知

參數	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	String	狀態說明	顯示原因
MerID	String	商店代號	　　
MerTradeNo	String	自訂編號	限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複

TradeNo	String	UNi序號	　　
TradeAmt	Int	訂單金額	　　
TradeStatus	Int	訂單付款狀態	固定=1
PaymentType	Int	支付方式	1=信用卡
2=ATM
3=超商代碼
5=取貨付款
6=愛金卡 (ICash)
7=後支付 (Aftee)
8=退貨代收
ShipTradeNo	String	UNi物流序號	
Odno	String	出貨單編號	8碼
GoodsType	Int	寄件型態	1=常溫，2=冷凍
LgsType	String	物流型態	B2C=大宗寄倉
C2C=店到店
ShipType	Int	通路類別	1=7-ELEVEN
ServiceType	Int	取件方式	1=取貨付款
3=取貨不付款
ShipAmt	Int	代收金額	
TradeAmt	Int	訂單金額	
PayTime	Date	取件日期	格式：YYYY-MM-DD HH:II:SS

當該交易有使用優惠劵核銷
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	
```


## <a id="103"></a>超商門市地圖(前景) (7/103)

```
超商門市地圖(前景)
簡要描述
當使用物流工具為超商取貨時，消費者需用特定的超商門市地圖API選擇取貨門市。
請留意：各項物流工具寄件類型(冷凍、常溫)的門市地圖略有不同。
超商門市地圖(前景)API版本號1.1為增加 限本島/含離島 以及MobileTag參數。(若版本號為1.0則無此選擇)
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：7-ELEVEN超商常溫/冷凍取貨(大宗寄倉B2C)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/logistics/ship_map

正式區：https://api.payuni.com.tw/api/logistics/ship_map

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Form Post
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
各API統一規格：商店→系統
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.1
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
MerKeyNo	Y	String	自訂編號	限制長度：20
商店能辨識使用即可
提醒：Tag=4或5時，請帶UNi物流序號
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍
LgsType	Y	String	物流型態	B2C=大宗寄倉
C2C=店到店
ShipType	Y	Int	通路類別	1=7-ELEVEN
MapType	Y	Int	地圖涵蓋區域	1=僅限本島
2=本島含離島
GoodsType=2，則MapType固定為2
MapReturnURL	C	String	接收物流門市資訊	可為空值
該參數有值時：Tag = 2、3、4、5，會以前景方式，將頁面導回指定URL。
Tag	Y	Int	標記	2=回傳選取的門市資訊
3=更新商店的退貨門市(僅限C2C使用)
4=更新物流單的取件門市
5=更新指定一筆物流單的
退貨門市(僅限C2C使用)
MobileTag	C	String	標記	N=PC版
Y=手機版
若沒帶此參數，則一律顯示PC版門市地圖

備註：
1.)若買家選擇的取件門市因天災、門市調整、連假等原因暫停取件服務，物流中心會發送【門市關轉】貨態。PAYUNi收到上述貨態後會寄送門市關轉通知信，提醒廠商變更門市。
2.)請在收到上述貨態規定期限內進行變更門市，傳遞方式如：傳遞LgsType=B2C、Tag=4更新物流單的取件門市。
3.)大宗寄倉(B2C)更換門市期限為：收到門市關轉通知(D)+2天 23:59 前要進行更換。
4.)店到店(C2C)更換門市期限為：收到門市關轉通知那天(D)+6天 23:59前要進行更換。
5.)店到店(C2C)若要重選門市時，請留意Tag的參數用法：Tag=3為商店的C2C退貨門市重選；Tag=5為指定一筆C2C物流單的退貨門市重選; Tag=4為C2C取件門市重選。
6.)若寄件型態為冷凍，則超商取貨門市一律依據超商可選門市規定：GoodsType=2，MapType=2。

MapReturnURL有指定位址時返回之參數
各API統一規格：系統→商店
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.1
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考錯誤代碼　　
Message	String	狀態說明	顯示原因
MerID	String	商店代號	　　
MerKeyNo	String	自訂編號	商店能辨識使用即可
提醒：Tag=4或5時，請帶UNi物流序號
GoodsType	Int	寄件型態	1=常溫，2=冷凍
LgsType	String	物流型態	B2C=大宗寄倉
C2C=店到店
ShipType	Int	通路類別	1=7-ELEVEN
MapJson	String	物流門市資訊	JSON格式
參數
(MapJson)	類型	說明	備註
StoreType	String	SEVEN	限制長度：5　　
StoreID	String	門市代碼	限制長度：6，例如：916712
StoreName	String	門市名稱	限制長度：12，例如：敦安門市
Address	String	門市地址	例如：台北市大安區安和路一段2
7號
InsularArea	String	門市區域識別代碼	I=本島
O=離島
```


## <a id="123"></a>超商出貨單列印(前景) (7/123)

```
超商出貨單列印(前景)
簡要描述
當使用物流工具出貨時，需列印出貨單貼至包裹。
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：7-ELEVEN超商常溫/冷凍取貨
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/logistics/print_label

正式區：https://api.payuni.com.tw/api/logistics/print_label

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Form Post
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.0
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
ShipTradeNo	Y	String	UNi物流序號	最多限制50筆，須以「半形逗號」隔開
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍
LgsType	Y	String	物流型態	B2C=大宗寄倉
C2C=店到店
ShipType	Y	Int	通路類別	1=7-ELEVEN
ShipDate	Y	String	出貨日期	格式為 YYYYMMDD
B2C出貨不得為當日
LabelMode	C	Int	列印標籤格式	1=A4版型
2=直立式
沒帶此值預設列印LabelMode=1

備註：
1)資料回傳亦採用 Form Post 方式回傳
2)C2C模式：列印出貨單需由PAYUNi系統跳轉至超商進行列印，商店不得自行連線取得，否則將導致連線失敗。
3)B2C模式：由PAYUNi系統直接顯示出貨單供列印。

Notify回傳參數

若送建立超商物流單請求時，其中有填寫NotifyURL參數，則該物流單發動列印成功時，會收到此Notify通知列印結果。

參數	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼
Message	Int	狀態說明	
MerID	String	商店代號	
ShipTradeNo	String	UNi物流序號	
GoodsType	Int	寄件型態	1=常溫，2=冷凍
LgsType	String	物流類型	B2C=大宗寄倉
C2C=店到店
ShipType	Int	通路類別	1=7-ELEVEN
PartnerId	String	母代碼	3碼
Odno	String	出貨單編號	8碼
ValidationNo	String	驗證碼	4碼
店到店專用
ApiType	String	API類別	固定回傳 Print

備註：
1) B2C大宗寄倉7-11配編編號查詢：PartnerId(3碼)+Odno(8碼)=11碼
2) C2C店到店7-11配編編號查詢：Odno(8碼)+ValidationNo(4碼)=12碼
3) LabelMode用於判斷B2C與C2C列印標籤格式；C2C店到店列印時，系統將跳轉至7-11超商列印網址
```


## <a id="125"></a>退貨便要號 (7/125)

```
退貨便要號
簡要描述
建立7-ELEVEN超商退貨便訂單使用，將退貨便編號提供給消費者，讓消費者可至門市ibon機輸入退貨便編號12碼，取得退貨單到櫃檯進行退貨作業。
僅提供開通7-ELEVEN超商常溫(大宗寄倉B2C常溫)才可使用C2B退貨便功能
透過7-ELEVEN 配送之物流單可於數網查件網站查詢配送編號的貨態：https://tracking.shopmore.com.tw/
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：7-ELEVEN超商常溫(大宗寄倉B2C)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
C2B退貨便
退貨及廠退流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/logistics/refund

正式區：https://api.payuni.com.tw/api/logistics/refund

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.0
EncryptInfo	Y	String	AES加密字串	資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
ShipTradeNo	C	String	UNi物流序號	
TradeNo	C	Int	UNi序號	
GoodsType	Y	Int	寄件類型	固定1
1=常溫
LgsType	Y	String	物流類型	C2B=退貨便
ShipType	Y	Int	通路類型	1=7-ELEVEN
TradeAmt	Y	Int	商品金額	長度限制：5
1~20000元
ServiceType	Y	Int	退貨方式	4=退貨付款
5=退貨不付款
ShipAmt	Y	Int	門市代收金額	當ServiceType =4則必填，1~999 元；當ServiceType =5則0
ShopperName	C	String	退貨人姓名	當ShipTradeNo有資料時，則回傳原訂單之收件人；若無ShipTradeNo則為必填
限制長度：10，最長5個中文字或10個英文字，若中英混合則取前5個字
ProcessType	Y	Int	方式	固定=1

備註：
1) 退貨便僅提供開通大宗寄倉B2C的會員使用
2) 會員可自行決定退貨是否需另外收款，若需要退貨代收則ServiceType=4，ShipAmt=1-999元
3) 若選擇純退貨服務，則ServiceType=5，ShipAmt=0

返回參數
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.0
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	Int	狀態說明	顯示原因
MerID	String	商店代號	　　
LgsType	String	物流型態	C2B=退貨便
ShipType	Int	通路類別	1=7-ELEVEN
PartnerId	String	母代碼	LagsType=C2B，長度限制：3
RefundODNO	String	退貨便編號	LagsType=C2B，長度限制：8
ValidationNo	Int	退貨便驗證碼	LagsType=C2B，長度限制：4
TradeAmt	Int	商品金額	等於訂單金額
ShipAmt	Int	門市代收金額	退貨代收金額
DeadlineDate	String	繳費期限	格式: YYYY-MM-DD HH:II:SS
TradeNo	String	UNi序號	
ShipTradeNo	String	UNi物流序號	

備註：
1) 取得退貨便編號時，請於繳費期限內至門市ibon取得退貨單，逾期則訂單取消
2) ibon退貨便代碼為：RefundODNO(8)+ValidationNo(4)，共12碼
```


## <a id="304"></a>店到店物流單轉宅配資料提供 (7/304)

```
店到店物流單轉宅配資料提供
簡要描述
買家未取貨導致退貨至退貨門市，且商店也未於期限內至退貨門市取件，包裹運回物流中心暫時保管，請商店於保管期限內提供宅配收件資料，由黑貓宅配將包裹退回至指定地址(運費為貨到付款)。
提供宅配收件資料時限：期限日期將於待轉宅配退回通知信內提供，敬請多加留意。
若送出的轉宅配收件資料填寫有誤，請於隔日13:30前重打本API更新資料，或來信/來電PAYUNi客服為您人工修正。
若期限截止前未提供宅配收件資料，則保管期滿後物流中心會將該退貨包裹銷毀處理，且後續不得申請賠償，過程中如有任何衍生費用，則將自會員UNi帳戶中扣除。
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：7-ELEVEN超商常溫/冷凍取貨(店到店C2C)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/ logistics/ c2c_to_home_delivery

正式區：https://api.payuni.com.tw/api/ logistics/ c2c_to_home_delivery

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
各API統一規格：商店→系統
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.0
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
ShipTradeNo	Y	String	UNi物流序號	
Consignee	Y	String	收件人姓名	
ConsigneeTel	Y	String	收件人連絡電話	
ConsigneeAddress	Y	String	收件人地址	

返回參數
各API統一規格：系統→商店
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
其餘為失敗
MerID	String	商店代號	　　
Version	String	版本	固定 1.0
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
其餘為失敗
失敗原因請參考 錯誤代碼　　
Message	String	狀態說明	
MerID	String	商店代號	　　
ShipTradeNo	String	UNi物流序號	
Consignee	String	收件人姓名	
ConsigneeTel	String	收件人連絡電話	
ConsigneeAddress	String	收件人地址
```


## <a id="268"></a>建立宅配單(背景) (7/268)

```
建立宅配單(背景)
簡要描述
PAYUNi平台提供物流服務並整合所有支付方式，會員可透過平台以最快速的串接方式，提供會員便捷的商品出貨服務，滿足消費者多元取貨及各支付方式的需求。
本文件主要說明物流工具串接方式，與各種物流交易流程。
當物流工具為黑貓宅配且消費者選擇取貨付款時，需建立取貨付款單。
提供不綁PAYUNi金流服務，純建立物流工具為黑貓宅配之服務。
使用前請確認黑貓宅配是否已啟用，狀態為審核中請再次確認寄件人地址是否正確；地址錯誤無法取得正確郵號無法正常使用。
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：黑貓宅配(含正逆物流之常溫與低溫配送)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
物流項目
消費者訂購商品完成後，會員即可進行備貨動作。
物流項目	支援與說明
黑貓宅配
常溫與低溫宅配	1. 提供到府收貨與配送到府服務。
2. 透過PAYUNi後台取得出貨單編號進行列印，並透過呼叫黑貓功能請黑貓司機於約定時間至指定地址收貨。
3. 需透過PAYUNi平台申請審核開通帳號(此物流工具商業及個人會員皆可使用)
4. 提供常溫及低溫(含冷凍與冷藏)寄件服務。
5. 黑貓宅配包裹查詢網頁，最多可同時查詢十筆宅配單號的貨態：https://www.t-cat.com.tw/inquire/trace.aspx
黑貓宅配
常溫與低溫退貨	1.提供到府收貨與配送到府服務。
2. 透過PAYUNi後台取得退貨編號，黑貓司機即會於建單時設定的取件日，攜帶退貨單至指定地址收取退件。
3. 需透過PAYUNi平台申請審核開通帳號(此物流工具商業及個人會員皆可使用)
4. 提供常溫及低溫(含冷凍與冷藏)退貨服務。
5. 黑貓宅配包裹查詢網頁，最多可同時查詢十筆退貨編號的貨態：https://www.t-cat.com.tw/inquire/trace.aspx
黑貓宅配
開通物流功能

商家出貨 - 消費者取貨流程

商家出貨 - 消費者因未取而退貨流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/home_delivery/trade

正式區：https://api.payuni.com.tw/api/home_delivery/trade

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
各API統一規格：商店→系統
Y=必要；C=選填
若未帶任何支付工具參數，則依據後台之開啟項目決定付款頁面啟用項目
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.2
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
MerTradeNo	Y	String	商店訂單編號	限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複

GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍，3=冷藏
LgsType	Y	String	物流型態	固定為HOME
ShipType	Y	Int	通路類別	2=黑貓
TradeAmt	Y	Int	訂單金額	等於取貨付款、取貨不付款金額
下限為30元，上限為20,000元
若ServiceType=3，則TradeAmt為商品價值
ServiceType	Y	Int	取件方式	1=取貨付款，3=取貨不付款
DeliveryTimeTag	Y	String	希望配達時段	01=13時前
02=14-18時
04=不指定
Consignee	Y	String	收件人姓名	限制長度：30
中、英文與數字均可支援
每個英文字母長度算一位，每個中文字或全形字符均算兩位
ConsigneeMobile	Y	String	收件人手機號碼	限填手機號碼09開頭，半形數字
ConsigneeTelAreaCode	C	String	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	String	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	String	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
ProdDesc	Y	String	商品名稱	最長20位
每個英文字母長度算一位，每個中文字或全形字符均算兩位
NotifyURL	C	String	宅配到付完成取件通知URL	若有填寫此參數，且訂單取件方式為1=取貨付款，則消費者收到宅配包裹並完成付款時，會發送Notify至此處填寫的URL。
僅限80與443 port
CarrierType	Y/C	String	發票載具類別	如需開立發票此參數必帶，無須開立則不用帶此參數。
3J0002 = 手機條碼
CQ0001 = 自然人憑證
amego = 會員載具
Donate = 捐贈碼
Company = 公司發票

CarrierInfo	Y/C	String	載具內容	當 CarrierType 為 3J0002、CQ0001、Donate、Company 時,此欄必需填入對應資訊。
例如：CarrierType=3J0002時，CarrierInfo需填手機條碼(含/)
CarrierType=CQ0001時，CarrierInfo需填自然人憑證
CarrierType=Donate時，CarrierInfo需填捐贈碼
CarrierType=Company時，CarrierInfo需填統編

InvBuyerName	Y/C	String	買方名稱或公司抬頭	當 CarrierType 有帶參數時，此欄位必填。
ProdDesc	Y/C	String	產品說明	當 CarrierType 有帶參數時，此欄位必填。
長度限制: 500
格式: 可透過半形分號(;)帶入多個敘述。
UsrMail	Y/C	String	消費者電子信箱	當 CarrierType 有帶參數時，此欄位必填。
CarrierType=amego時，UsrMail需填電子信箱
備註：

(1) 若為取貨不付款，則TradeAmt的訂單金額等同商品價值
(2) 若要了解宅配貨態變更時會發送的貨態Notify內容，請參考 宅配貨態通知

若有開啟優惠劵功能時，使用優惠碼於幕後API
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
PromoCode	Y	string	優惠碼	
DiscountAmt	Y	int	折扣金額	
OrderAmt	Y	int	原訂單金額	
CouponNotifyURL	C	string	優惠劵發劵背景通知網址	　
返回參數
各API統一規格：系統→商店
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.2
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　
Message	String	狀態說明	
MerID	String	商店代號	　　
MerTradeNo	String	自訂編號	限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複

TradeNo	String	UNi序號	　　
TradeAmt	Int	訂單金額	　　
TradeStatus	Int	訂單付款狀態	固定=0
PaymentType	Int	支付方式	10=宅配到付　
Gateway	Int	交易標記	1=幕後API　
TradeType	Int	宅配類別	固定1=正物流
ShipTradeNo	String	UNi物流序號	
GoodsType	Int	寄件型態	1=常溫，2=冷凍，3=冷藏
LgsType	String	物流型態	固定為HOME
ShipType	Int	通路類別	2=黑貓
ServiceType	Int	取件方式	1=取貨付款，3=取貨不付款
ShipAmt	Int	取貨付款金額	
Consignee	String	收件人姓名	
ConsigneeMobile	String	收件人手機號碼	
ConsigneeTel	String	收件人聯絡電話	區碼+號碼
若有帶時，會回 00-00000000
若交易當下沒帶時，則回 -
ConsigneeAddress	String	收件人地址	
DeliveryTimeTag	String	希望配達時段	01=13時前
02=14-18時
04=不指定
ProductTypeId	String	商品類別代碼	0001=一般食品
0002=名特產/甜產
0003=酒/油/醋/醬
0004=穀物蔬果
0005=水產/肉品
0006=3C
0007=家電
0008=服飾配件
0009=生活用品
0010=美容彩妝
0011=保健食品
0012=醫療相關用品
0013=寵物用品飼料
0014=印刷品
0015=其他
ProdDesc	String	商品名稱	

Notify參考格式 : 宅配到付取件完成通知 (背景) PAYUNi→Merchant

此為宅配到付單消費者已完成取件付款時會發的Notify通知

參數	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	String	狀態說明	顯示原因
MerID	String	商店代號	　　
MerTradeNo	String	自訂編號	限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複

TradeNo	String	UNi序號	　　
TradeAmt	Int	訂單金額	　　
TradeStatus	Int	訂單付款狀態	固定=1
PaymentType	Int	支付方式	1=信用卡
2=ATM
3=超商代碼
5=取貨付款
6=愛金卡 (ICash)
7=後支付 (Aftee)
8=退貨代收
ShipTradeNo	String	UNi物流序號	
Odno	String	出貨單編號	12碼
GoodsType	Int	寄件型態	1=常溫，2=冷凍, 3=冷藏
LgsType	String	物流型態	固定為HOME
ShipType	Int	通路類別	2=黑貓
ServiceType	Int	取件方式	1=取貨付款
ShipAmt	Int	代收金額	
TradeAmt	Int	訂單金額	
PayTime	Date	取件日期	格式：YYYY-MM-DD HH:II:SS

當該交易有使用優惠劵核銷
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	
```


## <a id="269"></a>產宅配編號並下載託運單PDF檔(前景) (7/269)

```
產宅配編號並下載託運單PDF檔(前景)
簡要描述
當使用黑貓宅配出貨時，需列印託運單貼至包裹。
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：黑貓宅配(含正物流常溫與低溫配送)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/home_delivery/get_obt_number_pdf

正式區：https://api.payuni.com.tw/api/home_delivery/get_obt_number_pdf

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Form Post
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.0
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
PostType	C	Int	傳遞方式	1=前景
PrintType	C	Int	列印模式	固定且預設=1
ShipTradeNo	Y	String	UNi物流序號	填入多筆時須以「半形逗號」隔開
GoodsType	Y	Int	寄件型態	1=常溫，2=冷凍，3=冷藏
LgsType	Y	String	物流型態	固定為HOME
ShipType	Y	Int	通路類別	2=黑貓
ShipDate	Y	Date	出貨日期	格式為 YYYYMMDD，
必須大於今日，且不得為周日及其他國定假日
DeliveryDate	Y	Date	希望配達日期	格式為 YYYYMMDD，
必須大於出貨日期，且不得為周日及其他國定假日
Spec	Y	Int	規格代碼	1=60，
2=90，
3=120，
4=150 (冷凍、冷藏不支援此規格)
HideProdDesc	C	String	是否隱藏商品名稱	預設N=無須隱藏，
Y=要隱藏
Memo	C	String	給黑貓的話	最長100位
每個英文字母長度算一位，每個中文字或全形字符均算兩位
備註：會產出託運單PDF檔供下載。
```


## <a id="270"></a>下載託運單PDF檔(前景) (7/270)

```
下載託運單PDF檔(前景)
簡要描述
若已發動過產宅配編號並下載託運單PDF檔(前景)API，但未將取得的託運單PDF檔下載時，可透過本API來補取得託運單PDF檔。
FileNo序號僅取得當下起算24小時內有效，超過期限則無法再運用該序號取得託運單PDF檔。
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：黑貓宅配(含正物流常溫與低溫配送)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/home_delivery/download_pdf

正式區：https://api.payuni.com.tw/api/home_delivery/download_pdf

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Form Post
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.0
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
FileNo	Y	String	檔名序號	此為產出宅配出貨編號時會回傳的序號
ShipTradeNo	C	String	UNi物流序號	在若須指定檔案內的特定幾筆宅配單，
請輸入UNi物流序號
多筆則須將UNi物流序號以半形逗號隔開
若無須指定，則免帶此參數或帶空值
備註：
有設定宅配貨態Notify的商店，發動產宅配編號並下載託運單PDF檔API成功時，會發送Notify給商店，Notify內容即包含本次列印的FileNo
打此API的當下會提供託運單PDF檔案
```


## <a id="271"></a>呼叫黑貓(背景) (7/271)

```
呼叫黑貓(背景)
簡要描述
黑貓宅配：已建立宅配單並列印好託運單，並將託運單黏貼至準備好的包裹後，需於希望出貨日，透過呼叫黑貓API預約黑貓司機到府取件。
若於15:00前完成預約服務，黑貓司機將於兩日內 (通常於15:00-18:00間)至指定地址收件，請提前準備好包裹。
若已為黑貓契約客戶並已有約定的收件時間，則無需使用本服務。
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/home_delivery/call_cat

正式區：https://api.payuni.com.tw/api/home_delivery/call_cat

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
各API統一規格：商店→系統
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.0
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
ContactName	Y	String	聯絡人姓名	限制長度：30
中、英文與數字均可支援
每個英文字母長度算一位，每個中文字或全形字符均算兩位
ContactMobile	C	String	聯絡人手機號碼	限填手機號碼09開頭
市話跟手機號碼需二擇一填寫
ContactTelAreaCode	C	String	聯絡人電話區碼	至少2碼、最多4碼數字
市話跟手機號碼需二擇一填寫
ContactTel	C	String	聯絡人電話號碼	最多8碼數字
市話跟手機號碼需二擇一填寫
ContactTelExt	C	String	聯絡人電話分機	最多8碼數字
市話跟手機號碼需二擇一填寫
ContactAddress	Y	String	聯絡人地址	最長120位
每個英文字母長度算一位，每個中文字或全形字符均算兩位
NormalQuantity	Y	Int	常溫包裹件數	填入0或正整數
ColdQuantity	Y	Int	冷藏包裹件數	填入0或正整數
FreezeQuantity	Y	Int	冷凍包裹件數	填入0或正整數
IsContact	Y	String	是否需要事先電聯	Y=要
N=否
IsTrolley	Y	String	是否需要推車	Y=要
N=否
Memo	C	String	給宅配人員的備註	最長100位
每個英文字母長度算一位，每個中文字或全形字符均算兩位
備註：
1) 常溫包裹件數、冷藏包裹件數與冷凍包裹件數的總和需大於0
2) 因不同溫層包裹需要的運輸車與溫控環境不同，每次呼叫僅可指定單一溫層的包裹件數>0 (EX：單次呼叫內，若設定常溫包裹件數為1件、冷藏包裹件數為2件，將回傳失敗)
返回參數
各API統一規格：系統→商店
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.0
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　
Message	String	狀態說明	
MerID	String	商店代號	　　
ErrorMsg	String	呼叫失敗原因	呼叫成功時回 -
呼叫失敗則會回錯誤訊息
CallTime	Date	呼叫時間	格式 YYYY-MM-DD HH:II:SS
```


## <a id="272"></a>建立宅配退貨單(背景) (7/272)

```
建立宅配退貨單(背景)
簡要描述
建立黑貓退貨單使用，將商店替消費者申請的退貨資訊提供給黑貓物流，黑貓司機將於退貨申請時設定的取件日，攜帶退貨單至退貨申請時指定的退貨地址收取退件。
開通黑貓宅配物流時即開通黑貓退貨，兩者均可支援常溫、冷凍與冷藏三種寄件型態
透過黑貓物流配送之退貨包裹可於黑貓宅配包裹查詢頁面查看退貨編號的貨態：https://www.t-cat.com.tw/inquire/trace.aspx
使用前登入PAYUNi後台，開通物流服務功能並向PAYUNi提出申請開啟【物流幕後API服務】與設定IP，等候審核通過後，即可開始使用物流幕後API
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的物流工具。
物流工具：黑貓退貨(含常溫與低溫)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
黑貓退貨
退貨流程

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/home_delivery/refund

正式區：https://api.payuni.com.tw/api/home_delivery/refund

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Version	Y	String	版本	固定 1.0
EncryptInfo	Y	String	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	String	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註

MerID
	Y	String	商店代號	　　
Timestamp	Y	Int	時間戳記	格式：time()
ShipTradeNo	C	String	UNi物流序號	若要針對正物流宅配單(原宅配單)進行退貨，須帶此參數
MerTradeNo	C	String	商店訂單編號	若不是原宅配單的退貨，此處需填寫新的自訂編號
限制長度：25
格式: [A-Za-z0-9_-]
10分鐘內不可重複
GoodsType	Y	Int	寄件類型	1=常溫，2=冷凍，3=冷藏
LgsType	Y	String	物流類型	固定為HOME
ShipType	Y	Int	通路類型	2=黑貓
ServiceType	Y	Int	退貨方式	3=取貨不付款
DeliveryTimeTag	Y	String	希望配達時間	01=13時前
02=14-18時
04=不指定
Consignee	Y	String	收件人姓名	
ConsigneeMobile	Y	String	收件人手機號碼	限填手機號碼09開頭，半形數字
ConsigneeTelAreaCode	C	String	收件人電話區碼	至少2碼、最多3碼數字
ConsigneeTel	C	String	收件人電話號碼	最多8碼數字
ConsigneeAddress	Y	String	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
Consignor	Y	String	退貨人姓名	
ConsignorTelAreaCode	C	String	退貨人電話區碼	至少2碼、最多3碼數字
ConsignorTel	C	String	退貨人電話號碼	最多8碼數字
ConsignorMobile	Y	String	退貨人手機號碼	限填手機號碼09開頭，半形數字
ConsignorAddress	Y	String	退貨人地址	請填寫黑貓司機收取退件之地址
最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)
ProdDesc	Y	String	商品名稱	最長20位
Spec	Y	Int	規格代碼	1=60cm
2=90cm
3=120cm
4=150cm (冷凍/冷藏不支援此規格)
ShipDate	Y	Date	取件日期	格式：YYYYMMDD
須至少為D+1，至多為 D+7 天
例如今日是 1/1，則取件日最多可設定為1/8
每日16:25後申請的黑貓退貨單，取件日請至少設定為D+2
Memo	C	String	備註給黑貓	最長100位
每個英文字母長度算一位，每個中文字或全形字符均算兩位
備註：以下參數會自動代入商店開通黑貓宅配物流時所填寫的聯絡資訊
(1) 收件人姓名
(2) 收件人手機號碼
(3) 收件人電話區碼
(4) 收件人電話號碼
(5) 收件人地址
返回參數
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.0
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	Int	狀態說明	顯示原因
MerID	String	商店代號	　　
TradeType	Int	宅配類別	2=逆物流(退貨)
MerTradeNo	String	商店訂單編號	
ShipTradeNo	String	UNi物流序號	
OBTNumber	String	退貨編號	
GoodsType	Int	寄件型態	1=常溫，2=冷凍，3=冷藏
LgsType	String	物流型態	固定為HOME
ShipType	Int	通路類別	2=黑貓
ServiceType	Int	取件方式	3=取貨不付款
Consignee	String	收件人姓名	
ConsigneeMobile	String	收件人手機號碼	
ConsigneeTel	String	收件人聯絡電話	區碼+號碼
若有帶時，會回 00-00000000
若交易當下沒帶時，則回 -
ConsigneeAddress	String	收件人地址	
Consignor	String	退貨人姓名	
ConsignorMobile	String	退貨人手機號碼	
ConsignorTel	String	退貨人電話	
ConsignorAddress	String	退貨人地址	
Spec	Int	規格代碼	1=60cm
2=90cm
3=120cm
4=150cm
ShipDate	Date	取件日期	格式：YYYYMMDD
DeliveryTimeTag	String	希望配達時間	01=13時前
02=14-18時
04=不指定
ProdDesc	String	商品名稱	
Gateway	Int	交易標記	1=幕後API
```


# 續期收款 API


## <a id="305"></a>續期收款-支付頁 (7/305)

```
續期收款-支付頁
簡要描述
串接前置作業
支付項目
續期收款-支付頁
請求 URL
請求方式
串接金鑰
測試區信用卡測試卡號
請求參數
返回參數
每期授權通知
續期收款-支付頁
簡要描述
消費者一次結帳 , 商店可設定週/月/年或自訂扣款日期 ,依據需求客製化首期與續期收款設定。
本文件主要提供會員可透過平台最快速的串接方式使用續期收款服務。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
信用卡	一次付清：包含國內卡、國外卡
續期收款-支付頁

請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/period/Page

正式區：https://api.payuni.com.tw/api/period/Page

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Form Post
使用HTML的<form>元素提交數據
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
卡片到期日及背面末三碼可任意輸入
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9-]
10分鐘內不可重複
PeriodAmt	Y	int	每期金額	金額>1元　
ProdDesc	Y	string	商品說明	長度限制:500 格式:可透過半形分號(;)帶入多個敘述
PayerName	C	string	付款人姓名	商店未帶入，消費者在支付頁仍須填寫資訊
PayerPhone	C	int	付款人電話	商店未帶入，消費者在支付頁仍須填寫資訊
PayerEmail	C	string	付款人Email	格式:信箱格式 商店未帶入，消費者在支付頁仍須填寫資訊
Cardholder	C	int	啟用信用卡3D交易時需輸入持卡人英文名稱，供發卡行驗證	預設不啟用
1=啟用
PayerFix	C	string	續期支付頁付款人姓名、電話、Email 若無帶入PayerFix參數，則預設可修改	1=付款人姓名
2=付款人電話
3=付款人Email
例如要固定付款人姓名或付款人Email，請帶入1,3
PeriodType	Y,C	string	扣款週期	week=每週
month=每月
year=每年
若商店自訂扣款設定無須帶入此參數
PeriodDate	Y,C	string	扣款日期	1.依扣款週期帶入指定值
2.week請帶入數字1~7其中一個,代表星期一~日
3.month請帶入數字1~31其中一個,代表每月1號~31號，若當月沒該日期則由該月最後一天做為扣款日期
4.year請帶入YYYY-MM-DD,例：2023-09-22代表2023年起，每年的9月22日執行扣款
5.若商店自訂扣款設定無須帶入此參數
PeriodTimes	Y,C	string	扣款期數	1.執行信用卡扣款交易的次數(上限900)
2.若商店自訂扣款設定無須帶入此參數
Date	Y,C	string	自訂扣款日期	1.提供商店在續期收款週期使用更有彈性；提供商店自訂扣款設定
2.商店自訂扣款日期與期數 YYYY-MM-DD 例如:商店扣款3期，帶入日期如下 2023-10-17,2023-10-30,2023-11-12
FAmt	C	int	首期金額	未帶入視同每期金額扣款，金額>1元
FType	Y	string	首期扣款設定	job=依原扣款排程
build=訂單建立當日
date=指定日期
首期日期設定非當日會以首次1元授權綁定信用卡
商店使用自訂扣款設定請帶入=job(依原扣款排程
FDate	C	string	首期扣款日期	FType =date 須帶入日期;格式為YYYY-MM-DD
NotifyURL	C	string	1.背景通知網址 將交易資料通知指定網址
當付款人每期執行信用卡授權交易完成後，以幕後方式通知商店授權結果
2.若此欄位為空值，則不通知商店授權結果
3.平台點選補觸發使用	格式: 完整網址
僅限80與443 port
請參考 每期授權通知
API3D	C	int	指定3D	1=強制3D；API3D僅於首次請求建立訂單;後續續期無3D
ReturnURL	C	string	返回指定網址 若無帶入會顯示PAYUNi付款結果頁	格式: 完整網址
BackURL	C	string	返回商店按鈕網址 PAYUNi付款結果頁點擊後返回指定網址	格式: 完整網址
TradeLExpireSec	C	int	付款頁面交易截止秒數 若未帶此參數則預設為600秒	格式: 60-600
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考>若失敗請參考 錯誤代碼
Message	狀態說明	授權成功=信用卡授權成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
AuthTime	授權時間	格式: HHIISS　　
AuthDay	授權日期	格式: YYYYMMDD　　
PeriodAmt	每期金額	
ProdDesc	商品說明	長度限制: 500
格式: 可透過半形分號(;)帶入多個敘述
PayerName	付款人姓名	商店未帶入，消費者在支付頁仍須填寫資訊
PayerPhone	付款人電話	商店未帶入，消費者在支付頁仍須填寫資訊
PayerEmail	付款人Email	格式:信箱格式
商店未帶入，消費者在支付頁仍須填寫資訊
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9-] 　
PeriodTradeNo	續期收款單號	商店與消費者約定交易，成立一筆續期收款單號；一筆續期收款單號將會有多期扣款。　　
TradeNo	UNI序號	
FAmt	首期金額	未帶入視同每期金額扣款
AuthAmt	首次授權金額	首期日期設定非當日會以首次1元授權綁定信用卡
DateList	扣款日期列表	待授權的日期列表
ResCode	回應碼	
ResCodeMsg	回應碼敘述
AuthCode	授權碼	　　
AuthBank	授權銀行(代碼)	　　
AuthBankName	授權銀行(名稱)	　　
CardBank	發卡銀行(代碼)	若為國內發卡行則為銀行代碼(3碼) 若非國內發卡行則為”-“
AuthType	授權類型	1=信用卡一次付清
Card6No	卡號前六碼	
Card4No	卡號後四碼	
CardExpired	信用卡有效日期	　　
每期授權通知
續期收款每期授權
每期授權會以Notify通知結果，請參考 每期授權通知
```


## <a id="329"></a>續期收款幕後 (7/329)

```
續期收款幕後
簡要描述
消費者一次結帳 , 商店可設定週/月/年或自訂扣款日期 ,依據需求客製化首期與續期收款設定。。
PAYUNi平台提供續期收款幕後機制，可滿足幕後API授權交易，會員須向PAYUNi提出申請，審核開通且綁定幕後授權IP即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
登入PAYUNi平台後於取得協助目錄下可下載申請表單向PAYUNi提出機制申請，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
信用卡	一次付清：包含國內卡、國外卡

續期收款幕後交易流程

續期幕後(非3D)：


續期幕後(3D)：


請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/period

正式區：https://api.payuni.com.tw/api/period

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
卡號到期日及背面末三碼可任意填入
請求參數
Y=必要；C=選填
若未帶任何支付工具參數，則依據後台之開啟項目決定付款頁面啟用項目
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9-]
10分鐘內不可重複
PeriodAmt	Y	int	每期金額	金額>1元　 　　
ProdDesc	Y	string	商品說明	長度限制:500 格式:可透過半形分號(;)
帶入多個敘述
CardNo	Y	string	信用卡號碼	
CardExpired	Y	string	信用卡有效日期	格式:MMYY
CardCVC	Y	string	安全碼	
PayerName	C	string	付款人姓名	
PayerPhone	C	int	付款人電話	
PayerEmail	Y	string	付款人Email	格式:信箱格式
PeriodType	Y,C	string	扣款週期	week=每週
month=每月
year=每年
若商店自訂扣款設定無須帶入此參數
PeriodDate	Y,C	string	扣款日期	1.依扣款週期帶入指定值
2.week請帶入數字1~7其中一個,代表星期一~日
3.month請帶入數字1~31其中一個,代表每月1號~31號，若當月沒該日期則由該月最後一天做為扣款日期
4.year請帶入YYYY-MM-DD,例：2023-09-22代表2023年起，每年的9月22日執行扣款
5.若商店自訂扣款設定無須帶入此參數
PeriodTimes	Y,C	string	扣款期數	1.執行信用卡扣款交易的次數(上限900)
2.若商店自訂扣款設定無須帶入此參數
Date	Y,C	string	自訂扣款日期	1.提供商店在續期收款週期使用更有彈性；提供商店自訂扣款設定
2.商店自訂扣款日期與期數 YYYY-MM-DD 例如:商店扣款3期，帶入日期如下 2023-10-17,2023-10-30,2023-11-12
FAmt	C	int	首期金額	未帶入視同每期金額扣款，金額>1元
FType	Y	string	首期扣款設定	job=依原扣款排程
build=訂單建立當日
date=指定日期
首期日期設定非當日會以首次1元授權綁定信用卡
商店使用自訂扣款設定請帶入=job(依原扣款排程
FDate	C	string	首期扣款日期	FType =date 須帶入日期;格式為YYYY-MM-DD
NotifyURL	C	string	1.背景通知網址 將交易資料通知指定網址
當付款人每期執行信用卡授權交易完成後，以幕後方式通知商店授權結果
2.若此欄位為空值，則不通知商店授權結果
3.平台點選補觸發使用	格式: 完整網址
僅限80與443 port
請參考 每期授權通知
API3D	C	int	幕後強制3D	1=幕後強制3D；API3D僅於首次請求建立訂單;後續續期無3D
ReturnURL	C	string	返回指定網址 僅於API3D=1時使用,於3D頁面完成後導回指定網址	格式: 完整網址
UserIP	C	string	消費者IP 若有帶入則會列入全平台風險管控機制，協助阻擋異常交易	
Cardholder	C	int	啟用信用卡3D交易時需輸入持卡人英文名稱，供發卡行驗證	預設不啟用
1=啟用
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考>若失敗請參考 錯誤代碼
Message	狀態說明	授權成功=信用卡授權成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9-] 　
PeriodTradeNo	續期收款單號	商店與消費者約定交易，成立一筆續期收款單號；一筆續期收款單號將會有多期扣款。　　
TradeNo	UNI序號	
AuthTime	授權時間	格式: HHIISS　　
AuthDay	授權日期	格式: YYYYMMDD　　
PeriodAmt	每期金額	
DateList	扣款日期列表	待授權的日期列表
FAmt	首期金額	未帶入視同每期金額扣款
AuthAmt	首次授權金額	首期日期設定非當日會以首次1元授權綁定信用卡
ResCode	回應碼	
ResCodeMsg	回應碼敘述
AuthCode	授權碼	　　
AuthBank	授權銀行(代碼)	　　
AuthBankName	授權銀行(名稱)	　　
CardBank	發卡銀行(代碼)	若為國內發卡行則為銀行代碼(3碼) 若非國內發卡行則為”-“
AuthType	授權類型	1=信用卡一次付清
Card6No	卡號前六碼	
Card4No	卡號後四碼	
CardExpired	信用卡有效日期	　　
強制3D
(API3D=1)	說明	備註
Status	狀態代碼	SUCCESS=建立幕後3D成功
若失敗請參考 錯誤代碼
Message	狀態說明	建立幕後3D成功
若失敗請參考 錯誤代碼
URL	強制3D導頁網址	　　
每期授權通知
續期收款每期授權
每期授權會以Notify通知結果，請參考 每期授權通知
```


## <a id="311"></a>續期收款狀態修改 (7/311)

```
續期收款狀態修改
簡要描述
提供尚未授權的續期收款訂單，商店可依據需求修改整筆訂單狀態或指定某期訂單狀態。
整筆訂單執行狀態說明:
1.原訂單暫停，可修改狀態【啟用】、【終止】；暫停後再次啟用將於最近一期開始授權。
2.原訂單啟用，可修改狀態【暫停】、【終止】
3.原訂單為終止，整筆訂單無法再次啟用、暫停
指定某期數執行狀態說明:
1.某期數原狀態為暫停，可修改狀態【啟用】；暫停後再次啟用將於最近一期開始授權。
2.某期數原狀態為啟用，可修改狀態【暫停】
3.某期數原狀態重新授權，僅可修改狀態【重新授權】
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/period/mdfStatus

正式區：https://api.payuni.com.tw/api/period/mdfStatus

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
ReviseTradeStatus	Y	string	修改訂單狀態	一.修改整筆訂單狀態請全小寫傳入
暫停=suspend 啟用=restart 終止=end
二.整筆訂單執行狀態說明:
1.原訂單為暫停,可修改狀態【啟用】、【終止】；暫停後再次啟用將於最近一期開始授權。
2.原訂單為啟用，可修改狀態【暫停】、【終止】
3.原訂單為終止，整筆訂單無法再次啟用、暫停
三.修改指定某期數訂單狀態(須帶入修改期數編號)請全小寫傳入
暫停=suspend 啟用=restart 重新授權=reauth
四.指定某期數執行狀態說明:
1.某期數原狀態為暫停，可修改狀態【啟用】；暫停後再次啟用將於最近一期開始授權
2.某期數原狀態為啟用，可修改狀態【暫停】
3.某期數原狀態重新授權，僅可修改狀態【重新授權】 　　
MerTradeNo	C	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9-]
PeriodTradeNo	Y	string	續期收款單號	　
PeriodOrderNo	C	int	修改期數編號	1.修改指定某期數訂單狀態須帶入編號
舉例 : 修改期數6請帶入6
2.修改期數僅單筆執行；若有二筆以上請分開執行。

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考>若失敗請參考 錯誤代碼
Message	狀態說明	成功=續期收款狀態修改成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9-] 　
PeriodTradeNo	續期收款單號	　　
TradeNo	UNI序號	僅重新授權成功回傳此欄位
PeriodOrderNo	續期訂單編號	僅重新授權成功回傳此欄位　　
每期授權通知
續期收款每期授權
每期授權會以Notify通知結果，請參考 每期授權通知
```


## <a id="316"></a>續期收款訂單內容修改 (7/316)

```
續期收款訂單內容修改
簡要描述
提供尚未授權的續期收款訂單，商店可依據需求修改訂單內容，包含金額、扣款週期與期數。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/period/Modify

正式區：https://api.payuni.com.tw/api/period/Modify

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
PayerName	C	string	付款人姓名	　　
PayerPhone	C	int	付款人電話	　　
PayerEmail	C	string	付款人Email	　　
PeriodTradeNo	Y	string	續期收款單號	　
PeriodAmt	C	int	每期金額	　
FAmt	C	int	首期金額	　
PeriodType	C	string	扣款週期	week=每週
month=每月
year=每年
若商店原訂單使用扣款週期，修改不可帶入自訂扣款日期　
PeriodDate	C	string	扣款日期	1.依扣款週期帶入指定值
2.week請帶入數字1~7其中一個,代表星期一~日
3.month請帶入數字1~31其中一個,代表每月1號~31號，若當月沒該日期則由該月最後一天做為扣款日期
4.year請帶入YYYY-MM-DD,例：2023-09-22代表2023年起，每年的9月22日執行扣款
5.若商店原訂單使用自訂扣款設定無須帶入此參數
6.修改扣款日期當天不作扣款，週期會以下一個扣款週期開始計算。舉例:今日1/19修改month=19，修改後最新一期授權日為2/19
7.若商店原訂單使用扣款日期，修改不可帶入自訂扣款日期　
PeriodTimes	C	string	扣款期數	1.執行信用卡扣款交易的次數
2.若商店原訂單使用扣款期數，修改不可帶入自訂扣款日期　
DateList	C	string	扣款日期列表(自訂扣款日期)	1.修改不可帶入已授權日或當天為扣款日期
2.原訂單使用自訂扣款日期。修改僅可帶入此參數　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考>若失敗請參考 錯誤代碼
Message	狀態說明	成功=續期收款訂單修改成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
PayerName	付款人姓名	　　
PayerPhone	付款人電話	　　
PayerEmail	付款人Email	　　
MerTradeNo	商店訂單編號	　
PeriodTradeNo	續期收款單號	　　
PeriodAmt	每期金額	
FAmt	首期金額	　
DateList	扣款日期列表	待授權的日期列表　
每期授權通知
續期收款每期授權
每期授權會以Notify通知結果，請參考 每期授權通知
```


## <a id="320"></a>續期收款訂單查詢 (7/320)

```
續期收款訂單查詢
簡要描述
查詢續期收款訂單，包含訂單扣款總期數與已扣款期數以及每期扣款排程。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/period/query

正式區：https://api.payuni.com.tw/api/period/query

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求參數
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
PeriodTradeNo	Y	string	續期收款單號	　　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考>若失敗請參考 錯誤代碼
Message	狀態說明	成功=續期收款狀態修改成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
MerTradeNo	商店訂單編號	　
PeriodTradeNo	續期收款單號	　　
PeriodType	扣款週期	week=每週
month=每月
year=每年
self=自訂扣款日期 　　
PeriodDate	扣款日期	1.扣款日期
week=1~7 ,代表星期一~日
month=1~31，代表每月1號~31號
year=YYYY-MM-DD，此欄位值為2023-09-22代表2023年起，每年的9月22日執行扣款
2.每月授權若當月沒該日期則由該月最後一天為扣款日
3.商店為自訂扣款日期此欄回傳空值
TotalTimes	扣款總期數	　　
AlreadyTimes	已扣款期數	　　
Result	明細資料	　　
由於可能多筆紀錄，故回傳資料統一為 Result 陣列 (由 0 開始)
Result參數說明
參數	說明	備註
Period	期數	　　
ExpAuthDT	扣款日期	　　
TradeNo	UNI序號	未授權期數此欄顯示- 　　
SubPeriodNo	續期訂單編號	未授權期數此欄顯示空值 　　
Amt	扣款金額	　　
AuthCode	授權碼	未授權期數此欄顯示空值　　
StatusDesc	回應說明	　　
UpdateTime	異動時間	　　
Result參數範例

Status=SUCCESS&Message=查詢明細資料成功&MerID=U09243164&MerTradeNo=20240123112919gmwVbL&PeriodTradeNo=20240123112904w7Kuvj&PeriodType=week&PeriodDate=2&TotalTimes=5&AlreadyTimes=1&Result[0][Period]=1&Result[0][ExpAuthDT]=2024-01-23+11:29:28&Result[0][TradeNo]=1705980559756516957&Result[0][SubPeriodNo]=20240123112919gmwVbL_1&Result[0][Amt]=5&Result[0][AuthCode]=000000&Result[0][StatusDesc]=授權完成&Result[0][UpdateTime]=2024-01-23+11:29:28&Result[1][Period]=2&Result[1][ExpAuthDT]=2024-01-30+00:00:00&Result[1][TradeNo]=-&Result[1][SubPeriodNo]=&Result[1][Amt]=66&Result[1][AuthCode]=&Result[1][StatusDesc]=排程中&Result[1][UpdateTime]=2024-01-23+11:29:28&Result[2][Period]=3&Result[2][ExpAuthDT]=2024-02-06+00:00:00&Result[2][TradeNo]=-&Result[2][SubPeriodNo]=&Result[2][Amt]=66&Result[2][AuthCode]=&Result[2][StatusDesc]=排程中&Result[2][UpdateTime]=2024-01-23+11:29:28&Result[3][Period]=4&Result[3][ExpAuthDT]=2024-02-13+00:00:00&Result[3][TradeNo]=-&Result[3][SubPeriodNo]=&Result[3][Amt]=66&Result[3][AuthCode]=&Result[3][StatusDesc]=排程中&Result[3][UpdateTime]=2024-01-23+11:29:28&Result[4][Period]=5&Result[4][ExpAuthDT]=2024-02-20+00:00:00&Result[4][TradeNo]=-&Result[4][SubPeriodNo]=&Result[4][Amt]=66&Result[4][AuthCode]=&Result[4][StatusDesc]=排程中&Result[4][UpdateTime]=2024-01-23+11:29:28

上述為範例，排程中的訂單系統會固定每日執行，當下查詢時，續期收款訂單會顯示為最新狀態，並且已執行的時間也會同步更新

每期授權通知
續期收款每期授權
每期授權會以Notify通知結果，請參考 每期授權通知
```


## <a id="330"></a>續期收款卡號修改-幕後 (7/330)

```
續期收款卡號修改-幕後
簡要描述
消費者若有卡號過期、額度不足…等需要更換卡號，商店可透過幕後修改信用卡號與到期日。
PAYUNi平台會員須向PAYUNi提出申請，審核開通且綁定幕後授權IP即可使用。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
登入PAYUNi平台後於取得協助目錄下可下載申請表單向PAYUNi提出機制申請，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
信用卡	一次付清：包含國內卡、國外卡
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/period/exchange

正式區：https://api.payuni.com.tw/api/period/exchange

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
卡號到期日及背面末三碼可任意填入
請求參數
Y=必要；C=選填
若未帶任何支付工具參數，則依據後台之開啟項目決定付款頁面啟用項目
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
PeriodTradeNo	Y	string	續期收款單號	　　
CardNo	Y	string	信用卡號碼	　　
CardExpired	Y	string	信用卡有效日期	格式:MMYY　　
CardCVC	Y	string	安全碼	　　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	資料加解密
HashInfo	加密 Hash	資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考>若失敗請參考 錯誤代碼
Message	狀態說明	成功=變更信用卡資訊成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
PeriodTradeNo	續期收款單號	　　
MerTradeNo	商店訂單編號	此為修改信用卡資訊帶入原商店訂單編號_隨機碼，方便商店區分。
舉例:商店訂單編號為20240326092039gQkK4N_c5UrR，原商店訂單編號則是20240326092039gQkK4N
　　
TradeNo	UNI序號	　　
OriginalMerTradeNo	原商店訂單編號	　　
AuthAmt	授權金額	　　
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardExpired	信用卡有效日期	　　
AuthTime	授權時間	　　
AuthDay	授權日期	　　
ResCode	回應碼	　　
ResCodeMsg	授權碼	　　
AuthBank	授權銀行(名稱)	　　
CardBank	發卡銀行(代碼)	　　
AuthType	授權類型	1=信用卡一次付清 　　
每期授權通知
續期收款每期授權
每期授權會以Notify通知結果，請參考 每期授權通知
```


## <a id="331"></a>續期收款卡號修改-支付頁 (7/331)

```
續期收款卡號修改-支付頁
簡要描述
消費者若有卡號過期、額度不足…等需要更換卡號，商店可透過幕前修改信用卡號與到期日。
本文件提供會員可透過平台支付頁方式修改續期收款卡號與到期日服務。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
登入PAYUNi平台後於取得協助目錄下可下載申請表單向PAYUNi提出機制申請，審核通過後即可串接。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
支付項目
支付項目	支援與說明
信用卡	一次付清：包含國內卡、國外卡
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/period/exchange

正式區：https://api.payuni.com.tw/api/period/exchange

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
測試區信用卡測試卡號
一次付清：4147631000000001，3560511000000001
卡號到期日及背面末三碼可任意填入
請求參數
Y=必要；C=選填
若未帶任何支付工具參數，則依據後台之開啟項目決定付款頁面啟用項目
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
PeriodTradeNo	Y	string	續期收款單號	　　
APIType	Y	int	續期收款卡號修改-支付頁=1	1.APIType=1 ，提供續期收款-變更卡號頁URL提供消費者變更；指定網址僅限使用一次、若要再次修改卡號資訊請重新發動修改。
2.連結有效時間60分；連結超過有效期限則無效；請重新發動修改。
　　
cardholder	C	int	啟用信用卡3D交易時需輸入持卡人英文名稱，供發卡行驗證	預設不啟用
1=啟用
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考>若失敗請參考 錯誤代碼
Message	狀態說明	成功=變更信用卡資訊成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
PeriodTradeNo	續期收款單號	　　
MerTradeNo	商店訂單編號	此為修改信用卡資訊帶入原商店訂單編號_隨機碼，方便商店區分。
舉例:商店訂單編號為20240326092039gQkK4N_c5UrR，原商店訂單編號則是20240326092039gQkK4N
　　
TradeNo	UNI序號	　　
OriginalMerTradeNo	原商店訂單編號	　　
AuthAmt	授權金額	　　
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardExpired	信用卡有效日期	　　
AuthTime	授權時間	　　
AuthDay	授權日期	　　
ResCode	回應碼	　　
ResCodeMsg	授權碼	　　
AuthBank	授權銀行(名稱)	　　
CardBank	發卡銀行(代碼)	　　
AuthType	授權類型	1=信用卡一次付清 　　
每期授權通知
續期收款每期授權
每期授權會以Notify通知結果，請參考 每期授權通知
```


# 優惠券 API


## <a id="391"></a>優惠券使用查詢 (7/391)

```
優惠券使用查詢
簡要描述
提供會員查詢優惠券是否可使用
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/coupon/chk_use

正式區：https://api.payuni.com.tw/api/coupon/chk_use

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
與 TradeNo 擇一
TradeAmt	Y	int	訂單金額	
PromoCode	Y	string	優惠碼	　
Timestamp	Y	int	時間戳記	　　
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
Message	狀態說明	查詢成功
若失敗請參考 錯誤代碼
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeAmt	訂單金額	　　
PromoCode	優惠碼	
CouponName	優惠劵名稱	
CouponType	優惠劵類型	1=折扣券
2=現金券
Discount	折扣金額/%數	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponNo	優惠劵序號	
```


## <a id="392"></a>優惠券全額折抵幕後 API (7/392)

```
優惠券全額折抵幕後 API
簡要描述
PAYUNi平台提供單筆交易使用優惠券全額折抵。
若單筆交易使用優惠券折抵後，金額為0，則需使用此API執行交易。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)申請開通所需要的支付工具。
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
請求 URL
測試區：https://sandbox-api.payuni.com.tw/api/coupon_pay

正式區：https://api.payuni.com.tw/api/coupon_pay

※為配合國際組織與各收單銀行對網站SSL傳輸加密機制要求，敬請採用TLS v1.2以上協定。

請求方式
Http Post
請於header加入user-agent，建議內容為”payuni”
串接金鑰
請登入PAYUNi平台檢視商店串接資訊取得 Hash Key及 Hash IV。
請求参数
Y=必要；C=選填
參數	必要	類型	說明	備註

MerID
	Y	string	商店代號	　　
Version	Y	string	版本	固定 1.0
EncryptInfo	Y	string	AES加密字串	請參考
資料加解密
資料加密陣列
HashInfo	Y	string	SHA256加密字串	請參考
資料加解密
資料加密陣列
參數
(EncryptInfo)	必要	類型	說明	備註
MerID	Y	string	商店代號	　　
MerTradeNo	Y	string	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
與 TradeNo 擇一
TradeAmt	Y	int	訂單金額	
Timestamp	Y	int	時間戳記	　　
UsrMail	C	string	消費者信箱	格式: 信箱格式。若有開啟物流功能時為必填，將視為物流收件人信箱　　
Timestamp	Y	string	商品說明	長度限制: 550，若超出則系統將自動截斷移除
格式: 可透過半形分號(;)帶入多個敘述　
PromoCode	Y	string	優惠碼	　
DiscountAmt	Y	int	折扣金額	　
OrderAmt	Y	int	原訂單金額	　

若有開啟物流功能時，使用此API做純門市取貨/純送貨到宅(即取貨不付款)
則需傳遞以下參數：

參數
(EncryptInfo)	必要	類型	說明	備註
ServiceType	Y	string	取件方式	固定為3=取貨不付款　
Consignee	Y	string	取件人姓名	限制長度：10
中文5個字，英文10個字 (請填寫真實姓名，超商取件時核對身分使用)
ConsigneeMobile	Y	string	取件人手機號碼	限填手機號碼09開頭，半形數字(請填寫真實手機號碼，包裹到店通知與超商取件時核對身分使用)
LgsType	Y	string	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	Y	int	寄件型態	1=常溫，2=冷凍, 3=冷藏
僅黑貓宅配支援冷藏溫層　
ShipType	Y	int	通路類別	1=7-ELEVEN, 2=黑貓宅配　
超商取貨不付款
(ShipType=1)	必要	類型	說明	備註
StoreID	Y	string	取件門市代碼	例如：916712　
黑貓宅配取貨不付款
(ShipType=2)	必要	類型	說明	備註
ConsigneeTelAreaCode	C	string	收件人電話區碼	至少2碼、最多3碼數字　
ConsigneeTel	C	string	收件人電話號碼	最多8碼數字　
ConsigneeAddress	Y	string	收件人地址	最長120位
格式應為：縣市+鄉鎮市區+段弄巷街+號(+樓)　
DeliveryTimeTag	Y	string	希望配達時段	01=13時前
02=14-18時
04=不指定　

備註：有帶ServiceType時，當作貨到不付款，並檢查格式

返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=查詢成功
若失敗請參考 錯誤代碼
Message	狀態說明	查詢成功
若失敗請參考 錯誤代碼
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-]
TradeAmt	訂單金額	　　
TradeNo	UNi序號	　　
TradeStatus	訂單狀態	1=交易成功
2=交易(折抵)失敗　　
PaymentType	支付工具	12=優惠劵完全折抵交易
PromoCode	優惠碼	
DiscountAmt	折扣金額	
OrderAmt	原訂單金額	
CouponFee	核銷費	
Discount	折扣金額/%數	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用信用卡幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
StoreID	取件門市代碼	例如：916712　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
黑貓宅配取貨不付款
(ShipType=2)	說明	備註
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
```


# Notify 背景通知 API (各支付/物流/續期/優惠券)


## <a id="80"></a>整合式支付頁 UNiPaypage (UPP) (7/80)

```
整合式支付頁 UNiPaypage (UPP)
簡要描述

PAYUNi平台提供金流代收服務並整合所有支付方式，會員可透過平台以最快速的串接方式，滿足消費者各種支付方式的需求。

本文件主要說明整合式支付串接方式，與各種支付交易流程，支付頁面採RWD設計，能讓消費者在不同設備的瀏覽器上，呈現最佳的瀏覽支付頁面，提供消費者多元的支付選擇。

返回方式
Form Post
返回參數
信用卡
(PaymentType=1)
請參考 UPP
虛擬帳號
(PaymentType=2)
請參考 UPP
超商代碼
(PaymentType=3)
請參考 UPP
取貨付款
(PaymentType=5)
請參考 UPP
愛金卡 (ICash)
(PaymentType=6)
請參考 UPP
先買後付 (Aftee)
(PaymentType=7)
請參考 UPP
LINE Pay
(PaymentType=9)
請參考 UPP
宅配到付
(PaymentType=10)
請參考 UPP
街口支付
(PaymentType=11)
請參考 UPP
優惠券
請參考 UPP
```


## <a id="53"></a>一頁收款 UNiOnepage (UOP) NOTIFY (7/53)

```
一頁收款 UNiOnepage (UOP) NOTIFY
簡要描述

PAYUNi平台提供金流代收服務並整合所有支付方式，會員可透過平台以最快速的串接方式，滿足消費者各種支付方式的需求。

本文件主要說明整合式支付串接方式，與各種支付交易流程，支付頁面採RWD設計，能讓消費者在不同設備的瀏覽器上，呈現最佳的瀏覽支付頁面，提供消費者多元的支付選擇。

串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)
於PAYUNi平台>新增一頁收款 > 通知設定 (輸入可通知Notify網址)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	請參照錯誤代碼連結
Message	狀態訊息	請參照錯誤代碼連結
MerchantId	商店代號	
MerchantName	商店名稱	
CreateTime	建立時間	
No	UNI序號	
OrderNo	商店訂單編號	
TradeAmt	訂單金額	
PayType	支付種類	
PayName	支付名稱	
PaymentType	支付工具	1=信用卡
2=ATM轉帳
3=代碼
5=取貨付款
6=愛金卡 (ICash)
7=後支付 (Aftee)
10=宅配到付
11=街口支付
TradeStatus	訂單狀態	0=等待付款
1=付款完成
2=付款失敗
3=付款取消
4=交易逾期
5=退款完成
6=取號失敗
8=訂單待確認
9=尚未付款
LinkName	連結名稱	　　
LinkCategory	連結類別	交易,繳費,捐款 　　
LinkType	連結種類	1=單次
2=重複 　　
ResultMsg	回應狀態結果	　　
Invoice	是否索取收據,發票	　　
Taxid	開立統編	　　
PaymentName	付款人名稱	　　
PaymentIdentity	付款人身分證編號	　　
PaymentPhone	付款人聯絡電話	　　
PaymentEmail	付款人電子信箱	　　
ReceiptName	收貨人名稱	　　
ReceiptPhone	收貨人電話	　　
DomicileAddr	戶籍地址	　　
ContactAddr	聯絡地址	　　
ReceiptAddr	收據地址	　　
RemarkInfo	備註	連結種類:交易或繳費 顯示買家備註內容 　　
信用卡
(PaymentType=1)	說明	備註
Card6No	卡號前六碼	　　
Card4No	卡號後四碼	　　
CardInst	分期數	　　
FirstAmt	首期金額	　　
EachAmt	每期金額	　　
ResCode	回應碼	　　
ResCodeMsg	回應碼敘述	　　
AuthCode	授權碼	　　
AuthBank	授權銀行(代碼)	　　
AuthBankName	授權銀行(名稱)	　　
AuthType	授權類型	1=一次
2=分期
3=紅利
4=Apple Pay
7=銀聯
AuthDay	授權日期	格式: YYYYMMDD
AuthTime	授權時間	格式: HHIISS
虛擬帳號
(PaymentType=2)	說明	備註
BankType	銀行(代碼)	請參考 銀行代碼(數字)
BankName	銀行名稱	　　
PayNo	繳費虛擬帳號	　　
PaySet	繳費設定	1=一次性
2=重覆性
ExpireDate	繳費截止時間	格式: YYYY-MM-DD HH:II:SS
超商代碼
(PaymentType=3)	說明	備註
Store	超商(代碼)	請參考 超商代碼(英文)
PayNo	繳費代碼	　　
ExpireDate	繳費截止時間	格式: YYYY-MM-DD HH:II:SS
超商物流
(PaymentType=5)	說明	備註
ShipTradeNo	UNi物流序號	　　
GoodsType	寄件型態	1=常溫
2=冷凍)
LgsType	物流運送模式	1=B2C(大宗寄倉)
ShipType	物流運送通路 超商/貨運通路別	1=7-ELEVEN
ServiceType	取貨方式	1=取貨付款
3=取貨不付款
StoreName	取貨門市	　　
StoreAddr	取貨地址	　　
Consignee	取貨人姓名	　　
ConsigneeMobile	取貨人手機	　　
icash Pay
(PaymentType=6)	說明	備註
ICPNo	愛金卡交易序號
ICPPayDT	付款日期時間	格式: YYYY-MM-DD HH:II:SS 　　
後支付 (Aftee)
(PaymentType=7)	說明	備註
ICPNo	Aftee交易序號	　　
PayTime	付款日期時間	格式: YYYY-MM-DD HH:II:SS 　　
宅配到付
(PaymentType=10)	說明	備註
ShipTradeNo	UNi物流序號	　　
GoodsType	寄件型態	1=常溫，2=冷凍，3=冷藏
LgsType	物流型態	固定為HOME=黑貓宅配
ShipType	通路類別	固定為2=黑貓宅配
ServiceType	取件方式	1=取貨付款
3=取貨不付款
Consignee	收件人姓名	　　
ConsigneeMobile	收件人手機	　　
ConsigneeAddress	收件人地址	　　
街口支付
(PaymentType=11)	說明	備註
JKoTradeNo	JKoPay交易號碼	
JKoStrCupAmt	店家街口券折抵	
JKoChannel	支付工具	account=儲值帳戶
bank=銀行帳戶
creditcard=信用卡
PayTime	付款日期時間	格式: YYYY-MM-DD HH:II:SS
錯誤代碼連結
參數	說明	備註
信用卡:CREDIT	Status開頭:CREDIT	錯誤代碼
虛擬帳號:ATM	Status開頭:ATM	錯誤代碼
超商代碼:CVS	Status開頭:CVS	錯誤代碼
```


## <a id="73"></a>虛擬帳號付款通知(ATM Notify) (7/73)

```
虛擬帳號付款通知(ATM Notify)
於測試區，如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數 (EncryptInfo)	說明	備註
Status	狀態代碼	請參照錯誤代碼連結
Message	狀態訊息	請參照錯誤代碼連結
MerID	商店代號	
TradeNo	UNi序號	
MerTradeNo	商店訂單編號	
NewMerTradeNo	新商店訂單編號	此參數為錯帳新增或是繳費金額不符所產生的商店訂單
TradeAmt	訂單金額	
PayNo	繳費虛擬帳號	
PayBank	付款銀行代碼	請參考
銀行代碼(數字)
PaySet	繳費帳號類型	1=單繳帳號(一次性)

Gateway	交易標記	1=幕後API；2=UniPayPage(UPP)；3=一頁收款(UOP)；5=賣場收款(SP)
Account5No	付款帳號末五碼	
TradeStatus	付款狀態	固定值；1=付款成功
PayTime	付款日期時間	
```


## <a id="74"></a>超商代碼付款通知(CVS Notify) (7/74)

```
超商代碼付款通知(CVS Notify)
於測試區，如欲測試付款完成結果，可登入測試區於交易動態明細點選「模擬繳費」按鈕。
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數 (EncryptInfo)	說明	備註
Status	狀態代碼	請參照錯誤代碼連結
Message	狀態訊息	請參照錯誤代碼連結
MerID	商店代號	
TradeNo	UNi序號	
MerTradeNo	商店訂單編號	
NewMerTradeNo	新商店訂單編號	此參數為錯帳新增或是繳費金額不符所產生的商店訂單
TradeAmt	訂單金額	
PayNo	繳費代碼	
PayStore	付款超商	請參考 超商代碼(英文)
Gateway	交易標記	1=幕後API；2=UniPayPage(UPP)；3=一頁收款(UOP)；5=賣場收款(SP)
TradeStatus	付款狀態	固定值；1=付款成功
PayTime	付款日期時間	
```


## <a id="75"></a>訂單付款期限到期通知 (7/75)

```
訂單付款期限到期通知
返回參數
參數	說明	備註
Status	狀態代碼	請參考錯誤代碼
ATM轉帳
超商代碼
愛金卡 icash Pay
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數 (EncryptInfo)	說明	備註
Status	狀態代碼	請參照錯誤代碼連結
Message	狀態訊息	請參照錯誤代碼連結
MerID	商店代號	
TradeNo	UNi序號	
MerTradeNo	商店訂單編號	
PaymentType	支付方式	2=ATM
3=超商代碼
6=愛金卡(icash Pay)
7=後支付(aftee)
11=街口支付
TradeAmt	訂單金額	
TradeStatus	付款狀態	固定值；4=訂單失效
PayNo	繳費代碼或是繳費序號	
CreateTime	訂單建立日期時間	格式 YYYY-MM-DD HH:II:SS
```


## <a id="291"></a>超商物流貨態通知 NOTIFY (7/291)

```
超商物流貨態通知 NOTIFY
簡要描述

若商店於PAYUNi後臺有開通超商物流服務時，有設定貨態Notify URL，則包裹交寄有可透過此Notify機制，接收包裹貨態更新的資訊，便利管理包裹配送狀況。

串接前置作業
請於PAYUNi平台註冊會員，申請開通所需要的超商物流服務(大宗寄倉、店到店的常溫或冷凍配送)
於PAYUNi平台 > 物流設定 > 申請/查看物流頁面輸入貨態Notify URL
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
Notify參考格式 : 貨態通知 PAYUNi→Merchant

大宗寄倉(B2C)與店到店(C2C)貨態通知時，回傳參數如下(EncryptInfo解密參數)：

參數	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	String	狀態說明	貨態狀態處理成功({ShipStatus })
MerID	String	商店代號	　　
PartnerId	String	母代碼	3碼 　　
ShipTradeNo	String	UNi物流序號	　　
LgsType	String	物流型態	B2C=大宗寄倉
C2C=店到店
GoodsType	Int	寄件型態	1=常溫，2=冷凍
ShipType	Int	通路類別	1=SEVEN
ShipStatus	Int	物流貨態狀態碼	詳閱物流貨態狀態碼
PickupStoreType	Int	取貨門市類型	物流貨態狀態碼81-門市關轉，會提供此參數區分關轉門市類型 1=取件門市 ，2=退件門市 僅在狀態碼為 81 時回傳，其他貨態不會包含此參數
ShipStatusDesc	String	貨態說明	
ShipStatusTime	DateTime	貨態日期	顯示最新貨態的更新日期時間
格式: YYYY-MM-DD HH:II:SS
ApiType	String	API類別	固定回傳 ShipStatus

退貨便(C2B)貨態通知時，回傳參數如下(EncryptInfo解密參數)：

參數	類型	說明	備註
Status	String	狀態	SUCCESS=成功
失敗請參考 錯誤代碼　　
Message	String	狀態說明	貨態狀態處理成功({ShipStatus })
MerID	String	商店代號	　　
PartnerId	String	母代碼	3碼 　　
RefundODNO	String	退貨便編號	8碼 　　
ValidationNo	String	退貨便驗證碼	4碼 　　
LgsType	String	物流型態	C2B=退貨便
GoodsType	Int	寄件型態	1=常溫
ShipType	Int	通路類別	1=SEVEN
ShipStatus	Int	物流貨態狀態碼	詳閱物流貨態狀態碼
ShipStatusDesc	String	貨態說明	
ShipStatusTime	DateTime	貨態日期	顯示最新貨態的更新日期時間
格式: YYYY-MM-DD HH:II:SS
ApiType	String	API類別	固定回傳 ShipStatus
```


## <a id="274"></a>宅配貨態通知 (7/274)

```
宅配貨態通知
請於開通黑貓宅配時，填寫貨態Notify URL。
交寄包裹貨態更新時會發送Notify通知。
返回參數
參數	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
MerID	String	商店代號	　　
Version	String	版本	固定 1.0
EncryptInfo	String	加密字串	請參考 資料加解密
HashInfo	String	加密 Hash	請參考 資料加解密
參數 (EncryptInfo)	類型	說明	備註
Status	String	狀態代碼	SUCCESS=成功
失敗請參考 錯誤代碼
Message	String	狀態訊息	
MerID	String	商店代號	
TradeType	Int	宅配類別	1=正物流(黑貓宅配)，
2=逆物流(黑貓退貨)
ShipTradeNo	String	UNi物流序號	
OBTNumber	String	宅配單號	
GoodsType	Int	寄件型態	1=常溫，2=冷凍，3=冷藏
LgsType	String	物流型態	固定為HOME
ShipType	Int	通路類別	2=黑貓
FileNo	String	檔名序號	用以重新下載託運單PDF檔
ShipStatus	Int	貨態代碼	請參考 貨態代碼
ShipStatusDesc	String	貨態說明	
ShipStatusTime	Date	貨態處理時間	
ApiType	String	API類別	固定回傳 ShipStatus
備註：FileNo的有效期限為取號後24小時內，請務必於此序號過期前下載託運單PDF檔
```


## <a id="306"></a>續期收款-每期授權完成通知 (7/306)

```
續期收款-每期授權完成通知
簡要描述
於建立續期訂單後，PAYUNi將於續期訂單指定的日期進行授權，每期的授權結果將以Notify方式回至續期訂單指定的NotifyURL。
串接前置作業
請於PAYUNi平台註冊會員，並且建立收款商店，取得商店代號(MerID)
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
如何建立續期收款訂單
請參考 續期收款-支付頁、續期收款幕後
返回參數
參數	說明	備註
Status	狀態代碼	請參考 錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考錯誤代碼
Message	狀態訊息	授權成功=信用卡授權成功
若失敗請參考 錯誤代碼
MerchantId	商店代號	
AuthTime	授權時間	格式: HHIISS
AuthDay	授權日期	格式: YYYYMMDD
ProdDesc	商品說明	長度限制: 500
格式:可透過半形分號(;)帶入多個敘述”
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9-]
PeriodTradeNo	續期收款單號	商店與消費者約定交易，成立一筆續期收款單號；一筆續期收款單號將會有多期扣款。
TradeNo	UNI序號	
PeriodOrderNo	續期訂單編號	商店訂單編號_期數；例如:商店訂單編號202311130944165TXNpu ，首期的續期訂單編號為202311130944165TXNpu_1、第二期續期訂單編號202311130944165TXNpu_2
AuthAmt	授權金額	
TotalTimes	扣款總期數	
ThisPeriod	本次扣款期數	本期是第幾期扣款期數，商店可判定此單還剩幾期
ResCode	回應碼	
ResCodeMsg	回應碼敘述	　　
AuthCode	授權碼	　　
AuthBank	授權銀行(代碼)	　　
AuthBankName	授權銀行(名稱)	　　
AuthBankName	授權銀行(名稱)	　　
NextAuthDate	下次授權日期	本期最後一期此欄為空值
```


## <a id="344"></a>訂單電子發票開立結果通知 (7/344)

```
訂單電子發票開立結果通知
簡要描述

若商店於交易API有帶入NotifyURL，或PAYUNi後臺串接設定有設定NotifyURL時，則可透過此Notify機制，接收電子發票的更新資訊。

串接前置作業
請於PAYUNi平台註冊會員，完成商店設定電子發票服務
於PAYUNi平台 > 商店清單 > 串接設定 > 設定 Notify URL
測試區：https://sandbox.payuni.com.tw
正式區：https://www.payuni.com.tw
返回參數 (Payuni系統 → 商店)
參數	說明	型態	備註
Status	狀態	String	SUCCESS成功，其餘失敗
MerID	商店代號	String	
Version	版本號	String	依交易版本號
EncryptInfo	加密字串	String	請參考 資料加解密
HashInfo	驗證字串	String	請參考 資料加解密
參數 (EncryptInfo)	類型	說明	備註
Status	String	狀態	SUCCESS 為成功，FAIL為失敗
Message	String	說明	原因
MerID	String	商店代號	
TradeNo	String	自訂編號	
MerTradeNo	String	原商店自訂編號	
TradeAmt	int	訂單金額	等同開立發票金額
InvoiceNotifyType	int	發票類別	C0401=開立發票
C0501=作廢發票

InvoiceInfo	String	發票資訊	3J0002=手機條碼
CQ0001=自然人憑證
amego=會員載具
Donate=捐贈發票
Company=公司發票

InvoiceStatus	int	發票狀態	1=成功(Status=SUCCESS)
2=失敗(包含開立或作廢失敗Status=FAIL)
5=已作廢(Status=SUCCESS)

InvoiceNo	String	發票號碼	Status為SUCCESS時回覆
InvoiceRandom	String	發票隨機碼	Status為SUCCESS時回覆
InvoiceTime	String	開立發票日期時間	Status為SUCCESS時回覆
TaxType	int	課稅別	1=應稅
SalesAmt	int	未稅金額	Status為SUCCESS時回覆
Barcode	String	電子發票條碼內容	Status為SUCCESS時回覆
QrcodeLeft	String	左側Qrcode	Status為SUCCESS時回覆
QrcodeRight	String	右側Qrcode	Status為SUCCESS時回覆
```


## <a id="390"></a>優惠券發放通知 (7/390)

```
優惠券發放通知
當該商店交易有符合發劵設定且為自行發放並設定notfiy

將回傳以下參數：

返回參數
參數	說明	備註
Status	狀態代碼	請參考錯誤代碼
ATM轉帳
超商代碼
愛金卡 icash Pay
MerID	商店代號	　　
Version	版本	固定 1.0
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數 (EncryptInfo)	說明	備註
Status	狀態代碼	請參照錯誤代碼連結
Message	狀態訊息	請參照錯誤代碼連結
MerID	商店代號	
TradeNo	UNi序號	
MerTradeNo	商店訂單編號	
CouponList	array	
參數 (CouponList)	說明	備註
PromoCode	優惠碼	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	
CouponURL	優惠劵網址	
```


## <a id="514"></a>免跳轉支付元件 3D 交易結果 Notify (7/514)

```
免跳轉支付元件 3D 交易結果 Notify
簡要描述
本文件為 3D 交易結果 Notify 說明，當使用免跳轉支付元件進行 3D 交易完成後，將返回參數 Noitfy 至指定網址。
返回方式
Form Post
返回參數
信用卡
請參考 信用卡幕後(CREDIT)
```


## <a id="520"></a>LINE Pay 幕後 Notify (7/520)

```
LINE Pay 幕後 Notify
簡要描述
本文件為 LINE Pay 幕後 Notify 說明，當使用LINE Pay 幕後交易完成後，將返回參數 Noitfy 至指定網址。
返回方式
Form Post
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.1
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	成功=交易成功
若失敗請參考 錯誤代碼
UNKNOWN=系統忙碌中，尚未確認交易結果
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-] 　　
Gateway	閘道	1=單串,2=UPP　
TradeNo	PAYUNi訂單編號	　　
TradeAmt	訂單金額	　　
TradeStatus	訂單狀態	0=建立
1=成功
2=失敗
PaymentType	支付工具	9=LINE Pay
LinePayID	LinePayID	　　
QRToken	導頁網址	　　
QRExpiredTime	導頁網址有效日期時間	　　

若有開啟優惠劵功能時，使用優惠碼於幕後API
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用LINE Pay幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
StoreID	取件門市代碼	例如：916712　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
黑貓宅配取貨不付款
(ShipType=2)	說明	備註
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
```


## <a id="521"></a>街口支付幕後 Notify (7/521)

```
街口支付幕後 Notify
簡要描述
本文件為街口支付幕後 Notify 說明，當使用街口支付幕後交易完成後，將返回參數 Noitfy 至指定網址。
返回方式
Form Post
返回參數
參數	說明	備註
Status	狀態代碼	SUCCESS=成功
UNKNOWN=等待授權結果逾期
若失敗請參考錯誤代碼
MerID	商店代號	　　
Version	版本	固定 1.1
EncryptInfo	加密字串	請參考 資料加解密
HashInfo	加密 Hash	請參考 資料加解密
參數
(EncryptInfo)	說明	備註
Status	狀態代碼	SUCCESS=成功
若失敗請參考 錯誤代碼
Message	狀態說明	成功=交易成功
若失敗請參考 錯誤代碼
UNKNOWN=系統忙碌中，尚未確認交易結果
MerID	商店代號	　　
MerTradeNo	商店訂單編號	限制長度: 25
格式: [A-Za-z0-9_-] 　　
Gateway	閘道	1=單串　
TradeNo	PAYUNi訂單編號	　　
TradeAmt	訂單金額	　　
JKoTradeNo	JKoPay交易號碼	
JKoStrCupAmt	店家街口券折抵	
JKoChannel	支付工具	account=儲值帳戶
bank=銀行帳戶
creditcard=信用卡
TradeStatus	訂單狀態	0=建立
1=成功
2=失敗
PaymentType	支付工具	11=JKoPay
PayTime	付款日期時間	格式: YYYY-MM-DD HH:II:SS

當該交易有使用優惠劵核銷
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
PromoCode	優惠碼	
DiscountAmt	折扣金額	　
OrderAmt	原訂單金額	　
CouponFee	核銷費	
CampaignName	活動名稱	
CampaignNo	活動序號	
CouponName	優惠劵名稱	
CouponNo	優惠劵序號	

若有開啟物流功能時，使用街口支付幕後API做純門市取貨/純送貨到宅(即取貨不付款)
將回傳以下參數：

參數
(EncryptInfo)	說明	備註
ShipTradeNo	UNi物流序號	
ServiceType	取件方式	固定為3=取貨不付款　
LgsType	物流型態	B2C=大宗寄倉
C2C=店到店
HOME=黑貓宅配　
GoodsType	寄件型態	1=常溫，2=冷凍, 3=冷藏
ShipType	通路類別	1=7-ELEVEN，2=黑貓宅配
ShipAmt	取貨付款金額	固定為0
Consignee	取件人姓名	
ConsigneeMail	取件人電子信箱	
ConsigneeMobile	取件人手機號碼	　
超商取貨不付款
(ShipType=1)	說明	備註
StoreID	取件門市代碼	例如：916712　
StoreName	取件門市名稱	　　
StoreAddr	取件門市地址	　　
黑貓宅配取貨不付款
(ShipType=2)	說明	備註
ConsigneeAddress	收件人地址	　
DeliveryTimeTag	希望配達時段	01=13時前
02=14-18時
04=不指定
```


---

# 簡化摘要（非核心串接資料）

## PAYUNi SDK

提供使用以下SDK，快速串接統一金流PAYUNi之金流系統。

類別	環境版本	說明
PHP	PHP 環境需 v7.0 或更新版本	請點此查看詳細說明
.NET	.NET Framework 環境需 v4.7.2 或更新版本	請點此查看詳細說明

## PAYUNi 購物車模組

提供使用以下購物車模組，可直接透過安裝設定此套件，快速串接統一金流PAYUNi之金物流服務。

類別	版本	支援工具	說明
Magento	2.3.5或更新版本	金流	請點此查看詳細說明
WooCommerce	6.0.2或更新版本	金流
物流(超商取貨/黑貓宅配)
電子發票	請點此查看詳細說明
OpenCart 3.X	3.0.3.8	金流	請點此查看詳細說明
OpenCart 4.0	4.0.1.1	金流	請點此查看詳細說明

## 信用卡交易狀態說明 / 交易訂單金額限制說明

商店信用卡請款設定的不同，對信用卡交易狀態的影響。

信用卡交易狀態說明

交易訂單金額限制說明
支付工具	訂單金額限制
信用卡	1~199,999元
ATM 轉帳	15~49,999元
超商代碼	30~20,000元
icash Pay	依 icash Pay 公告為主
AFTEE先享後付	20~49,999元
貨到付款(超商取貨付款)	1~20,000元
LINE Pay	依 LINE Pay 公告為主
街口支付	依街口支付公告為主
宅配貨到付款(黑貓宅配取貨付款)	30~20,000元

## 修改記錄

> 完整修改歷史請見原始頁面：https://docs.payuni.com.tw/web/#/7/25 （內容自2022年8月至今，篇幅過長此處不展開）

## 錯誤代碼（各 API 對應錯誤代碼表，僅列出連結，內容請於原頁面查看）

- [所有API通用錯誤代碼](https://docs.payuni.com.tw/web/#/7/156)
- [交易建立 (整合式支付頁|UPP)](https://docs.payuni.com.tw/web/#/7/44)
- [交易建立(信用卡免跳轉支付元件)](https://docs.payuni.com.tw/web/#/7/515)
- [交易建立 (虛擬帳號|ATM)](https://docs.payuni.com.tw/web/#/7/46)
- [交易建立 (超商代碼|CVS)](https://docs.payuni.com.tw/web/#/7/47)
- [非信用卡退款轉匯](https://docs.payuni.com.tw/web/#/7/78)
- [交易取消(超商代碼|CVS)](https://docs.payuni.com.tw/web/#/7/334)
- [交易查詢](https://docs.payuni.com.tw/web/#/7/30)
- [交易建立 (信用卡|CREDIT)](https://docs.payuni.com.tw/web/#/7/45)
- [交易請退款 (信用卡|CREDIT)](https://docs.payuni.com.tw/web/#/7/43)
- [交易取消授權 (信用卡|CREDIT)](https://docs.payuni.com.tw/web/#/7/42)
- [信用卡綁定查詢 (約定) (CREDIT)](https://docs.payuni.com.tw/web/#/7/48)
- [信用卡綁定取消 (約定/快速) (CREDIT)](https://docs.payuni.com.tw/web/#/7/49)
- [交易建立 (愛金卡|ICASH)](https://docs.payuni.com.tw/web/#/7/70)
- [交易退款 (愛金卡|ICASH)](https://docs.payuni.com.tw/web/#/7/71)
- [交易建立 (後支付|AFTEE)](https://docs.payuni.com.tw/web/#/7/81)
- [交易確認 (後支付|AFTEE)](https://docs.payuni.com.tw/web/#/7/82)
- [交易退款 (後支付|AFTEE)](https://docs.payuni.com.tw/web/#/7/83)
- [交易建立 (LINE Pay)](https://docs.payuni.com.tw/web/#/7/325)
- [交易退款 (LINE PAY)](https://docs.payuni.com.tw/web/#/7/347)
- [交易建立 (街口支付 | JKoPay)](https://docs.payuni.com.tw/web/#/7/387)
- [交易退款（街口支付）](https://docs.payuni.com.tw/web/#/7/378)
- [物流相關錯誤代碼](https://docs.payuni.com.tw/web/#/7/119)
- [續期收款建立](https://docs.payuni.com.tw/web/#/7/307)
- [續期收款狀態修改](https://docs.payuni.com.tw/web/#/7/310)
- [續期收款訂單內容修改](https://docs.payuni.com.tw/web/#/7/317)
- [續期收款卡號修改](https://docs.payuni.com.tw/web/#/7/328)
- [續期收款訂單查詢](https://docs.payuni.com.tw/web/#/7/318)
- [撥款提領查詢](https://docs.payuni.com.tw/web/#/7/220)
- [OPEN POINT](https://docs.payuni.com.tw/web/#/7/315)
- [優惠券使用查詢](https://docs.payuni.com.tw/web/#/7/393)
- [優惠券全額折抵幕後API](https://docs.payuni.com.tw/web/#/7/394)

## 銀行代碼 / 超商代碼

> 表格為動態渲染，內容請直接查看原頁面：
- 銀行代碼: https://docs.payuni.com.tw/web/#/7/50
- 超商代碼: https://docs.payuni.com.tw/web/#/7/51

---

## 已完成整合（introvista.ai 測試實作，2026-07-10）

### 環境變數（`p:\Introvsta\.env`）
| 變數 | 值（示意） | 說明 |
|---|---|---|
| `PAYUNI_MER_ID` | `U075679593` | 商店代號（fgpay / namegain / Ownio 共用） |
| `PAYUNI_HASH_KEY` | `D6ENnNzhRYzU...` | AES-256-GCM 加密 Key（32 bytes） |
| `PAYUNI_HASH_IV` | `RmQ2SQb9fbnV78JY` | AES-256-GCM IV（16 bytes） |

### 實作檔案
| 檔案 | 說明 |
|---|---|
| `lib/payuni.ts` | AES-256-GCM 加解密 + SHA-256 簽章工具（`payuniEncrypt` / `payuniDecrypt` / `payuniHash` / `payuniVerify`） |
| `app/api/pay/create/route.ts` | 建立 UPP 訂單，加密參數後回傳給前端自動 Form POST |
| `app/api/pay/notify/route.ts` | PAYUNi 背景通知（Webhook），驗簽後記錄付款結果，回傳 `"OK"` |
| `app/api/pay/return/route.ts` | PAYUNi 前景 Return URL，驗簽後帶 `MerTradeNo` redirect 回業務頁面 |

### 加解密實作重點（Node.js）
```typescript
// 加密（送出訂單用）
function payuniEncrypt(plaintext: string): string {
  const cipher = crypto.createCipheriv('aes-256-gcm', HASH_KEY, Buffer.from(HASH_IV));
  let ct = cipher.update(plaintext, 'utf8', 'base64');
  ct += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');
  return Buffer.from(`${ct}:::${tag}`).toString('hex');
}
// SHA-256 簽章
function payuniHash(encryptStr: string): string {
  return crypto.createHash('sha256')
    .update(`${HASH_KEY}${encryptStr}${HASH_IV}`)
    .digest('hex').toUpperCase();
}
```

### UPP 付款流程
```
前端 fetch POST /api/pay/create
  → 後端組參數（MerID, MerTradeNo, TradeAmt, Timestamp, ProdDesc, ReturnURL, NotifyURL）
  → payuniEncrypt() + payuniHash()
  → 回傳 { merID, version, encryptInfo, hashInfo, uppUrl }
前端 auto-submit <form method=POST action=uppUrl>
  → 用戶在 PAYUNi 頁面完成付款
PAYUNi POST /api/pay/notify（背景）
  → payuniVerify() 驗簽 → payuniDecrypt() 解密
  → Status=SUCCESS → 觸發升級 / 開立發票
PAYUNi redirect /api/pay/return（前景 Form POST）
  → 同上驗簽解密 → 取出 MerTradeNo
  → 302 redirect 回業務頁面 ?paid=1&order=MerTradeNo
```

### 重要實作說明
- **Status 成功值**：PAYUNi 回傳的 `Status` 成功為字串 `"SUCCESS"`（非數字 `1`），Notify 與 Return 皆適用。
- **ReturnURL**：PAYUNi 以 **Form POST** 方式回傳，Next.js 路由須同時實作 `POST` handler；GET 可作備援。
- **訂單號格式**：`TEST{unix_timestamp}{4碼隨機英數}`，例 `TEST17836701234ABCD`，10 分鐘內不可重複。
- **NotifyURL / ReturnURL**：僅限 80/443 port，需為公開可存取的 HTTPS 網址，不支援 localhost。
- **測試驗證結果**：2026-07-10 於 sandbox 完成 1 元信用卡付款，Status=SUCCESS，電子發票（速買配）號碼 DU20633400 成功開立。
- **環境必須一致**：`PAYUNI_ENV` 與商店代號須同一區。正式區 `MerID`（如 `U075679593`）若打到 `sandbox-api.payuni.com.tw` 會回「商店不存在」。本機改 `.env` 後務必重啟 `npm run dev`。
- **與 SmilePay**：金流用 PAYUNi；電子發票用 SmilePay（`SMILEPAY_GRVC` / `SMILEPAY_VERIFY_KEY`），兩套憑證不可混用。
