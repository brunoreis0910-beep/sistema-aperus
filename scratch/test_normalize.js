const data = {
  id_cliente: 3,
  grupos_excecao: [16, 4],
  nome_razao_social: "AMERPUS INFORMATICA LTDA",
  tipo_desconto: "PERCENTUAL",
  valor_desconto: "5.00"
};

// We don't need to import the whole file if we just copy the function and test it
const formatCPF = (v) => v;
const formatCNPJ = (v) => v;
const formatTelefone = (v) => v;
const formatCEP = (v) => v;

const normalizeClienteData = (data) => {
  const id = data.id || data.pk || data.cliente_id || data.id_cliente || data.codigo || null;

  return {
    id: id,
    nome: data.nome || data.nome_razao_social || data.name || '',
    razao_social: data.razao_social || data.nome_razao_social || data.company_name || '',
    cnpj: (() => {
      const cpfCnpj = data.cpf_cnpj || data.cnpj || data.cpf || '';
      if (!cpfCnpj) return '';
      const numbers = cpfCnpj.replace(/\D/g, '');
      if (numbers.length === 11) return formatCPF(cpfCnpj);
      if (numbers.length === 14) return formatCNPJ(cpfCnpj);
      return cpfCnpj;
    })(),
    grupos_excecao: Array.isArray(data.grupos_excecao)
      ? data.grupos_excecao.map((item) => {
          if (typeof item === 'object') {
            return item.id || item.id_grupo || item.pk || item.value || null;
          }
          return item;
        }).filter(Boolean)
      : [],
  };
};

console.log("First normalization:");
const normalized = normalizeClienteData(data);
console.log(normalized);

console.log("\nSecond normalization (re-normalizing normalized client):");
const normalized2 = normalizeClienteData(normalized);
console.log(normalized2);
