import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import javax.xml.crypto.dsig.CanonicalizationMethod;
import javax.xml.crypto.dsig.DigestMethod;
import javax.xml.crypto.dsig.Reference;
import javax.xml.crypto.dsig.SignatureMethod;
import javax.xml.crypto.dsig.SignedInfo;
import javax.xml.crypto.dsig.Transform;
import javax.xml.crypto.dsig.XMLSignature;
import javax.xml.crypto.dsig.XMLSignatureFactory;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.KeyInfo;
import javax.xml.crypto.dsig.keyinfo.KeyInfoFactory;
import javax.xml.crypto.dsig.keyinfo.X509Data;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class XmlSigner {

    public static void main(String[] args) {
        if (args.length < 4) {
            System.err.println("Uso: java XmlSigner <xml_path> <cert_path> <password> <output_path>");
            System.exit(1);
        }

        String xmlPath = args[0];
        String certPath = args[1];
        String password = args[2];
        String outputPath = args[3];

        try {
            // 1. Carregar documento XML
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(true);
            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true); // Seguranca
            Document doc = dbf.newDocumentBuilder().parse(new File(xmlPath));

            // 2. Encontrar o elemento para assinar (deve conter atributo Id)
            Element elementToSign = findElementToSign(doc.getDocumentElement());
            if (elementToSign == null) {
                throw new Exception("Nenhum elemento com atributo 'Id' (infNFe, infInut, infEvento, infMDFe, infCTe) encontrado para assinar.");
            }

            String idAttr = elementToSign.getAttribute("Id");
            // Registrar atributo Id como o identificador da tag no DOM
            elementToSign.setIdAttribute("Id", true);

            // 3. Carregar certificado PFX / PKCS12
            KeyStore ks = KeyStore.getInstance("PKCS12");
            try (FileInputStream certFis = new FileInputStream(certPath)) {
                ks.load(certFis, password.toCharArray());
            }

            String alias = null;
            Enumeration<String> aliases = ks.aliases();
            while (aliases.hasMoreElements()) {
                String a = aliases.nextElement();
                if (ks.isKeyEntry(a)) {
                    alias = a;
                    break;
                }
            }

            if (alias == null) {
                throw new Exception("Nenhuma chave privada encontrada no certificado.");
            }

            PrivateKey privateKey = (PrivateKey) ks.getKey(alias, password.toCharArray());
            X509Certificate cert = (X509Certificate) ks.getCertificate(alias);

            // 4. Inicializar Fabrica de Assinatura XML
            XMLSignatureFactory fac = XMLSignatureFactory.getInstance("DOM");

            // Configurar transformacoes
            List<Transform> transformList = new ArrayList<>();
            transformList.add(fac.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null));
            transformList.add(fac.newTransform(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null));

            // Criar Referencia
            Reference ref = fac.newReference(
                "#" + idAttr,
                fac.newDigestMethod(DigestMethod.SHA1, null),
                transformList,
                null,
                null
            );

            // Criar SignedInfo
            SignedInfo si = fac.newSignedInfo(
                fac.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                fac.newSignatureMethod(SignatureMethod.RSA_SHA1, null),
                Collections.singletonList(ref)
            );

            // Criar KeyInfo contendo o certificado
            KeyInfoFactory kif = fac.getKeyInfoFactory();
            X509Data x509Data = kif.newX509Data(Collections.singletonList(cert));
            KeyInfo ki = kif.newKeyInfo(Collections.singletonList(x509Data));

            // 5. Configurar contexto de assinatura
            Node parentNode = elementToSign.getParentNode();
            DOMSignContext dsc = new DOMSignContext(privateKey, parentNode); // Sempre insere no fim para respeitar a ordem do XSD (depois de infNFeSupl se existir)

            // Realizar assinatura
            XMLSignature signature = fac.newXMLSignature(si, ki);
            signature.sign(dsc);

            // 6. Gravar o XML assinado
            TransformerFactory tf = TransformerFactory.newInstance();
            Transformer trans = tf.newTransformer();
            trans.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");
            trans.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
            
            try (FileOutputStream fos = new FileOutputStream(outputPath)) {
                trans.transform(new DOMSource(doc), new StreamResult(fos));
            }

            System.out.println("XML assinado com sucesso.");
            System.exit(0);

        } catch (Exception e) {
            System.err.println("Erro ao assinar XML: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static Element findElementToSign(Node node) {
        if (node.getNodeType() == Node.ELEMENT_NODE) {
            Element el = (Element) node;
            if (el.hasAttribute("Id")) {
                String tagName = el.getLocalName() != null ? el.getLocalName() : el.getTagName();
                if (tagName.equals("infNFe") || tagName.equals("infInut") || tagName.equals("infEvento") || 
                    tagName.equals("infMDFe") || tagName.equals("infCTe") || tagName.equals("infCte")) {
                    return el;
                }
            }
        }
        NodeList children = node.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Element res = findElementToSign(children.item(i));
            if (res != null) {
                return res;
            }
        }
        return null;
    }
}
