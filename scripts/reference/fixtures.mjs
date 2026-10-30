// Documento .api.json mínimo para os testes, no mesmo formato do tools/ApiExtractor do pbsu-loader.
export function sampleDocument(overrides = {}) {
	return {
		schema: 1,
		assembly: 'PBSLoaderCommonUtils',
		version: '2.0.0',
		types: [
			{
				id: 'T:PBSLoaderCommonUtils.Sdk',
				name: 'Sdk',
				fullName: 'PBSLoaderCommonUtils.Sdk',
				namespace: 'PBSLoaderCommonUtils',
				kind: 'class',
				signature: 'public static class Sdk',
				docs: { summary: 'Ciclo de vida do SDK. Segunda frase.', remarks: 'Use `Sdk.Fase` antes de &lt;ler&gt;.', example: '```csharp\nSdk.Requer("2.0", "X");\n```' },
				members: [
					{ id: 'F:PBSLoaderCommonUtils.Sdk.Versao', name: 'Versao', kind: 'constant', signature: 'public const string Versao = "2.0.0"', isStatic: true, docs: { summary: 'Versão da API.' } },
					{
						id: 'M:PBSLoaderCommonUtils.Sdk.Requer(System.String,System.String)', name: 'Requer', kind: 'method', isStatic: true,
						signature: 'public static bool Requer(string versaoMinima, string mod)',
						docs: { summary: 'Confere a versão.', remarks: 'Avisa o jogador.', value: 'nada', example: 'Sdk.Requer("2.0", "X")' },
						parameters: [{ name: 'versaoMinima', type: 'string', description: 'A mínima.' }, { name: 'mod', type: 'string' }],
						returns: { type: 'bool', description: 'true se serve.' },
					},
					{ id: 'M:PBSLoaderCommonUtils.Sdk.Velho', name: 'Velho', kind: 'method', signature: 'public static void Velho()', isStatic: true, obsolete: '' },
					{ id: 'E:PBSLoaderCommonUtils.Sdk.FaseMudou', name: 'FaseMudou', kind: 'event', signature: 'public static event Action<Fase> FaseMudou', isStatic: true },
					{
						id: 'M:PBSLoaderCommonUtils.Sdk.Seguro(System.Action,System.String)', name: 'Seguro', kind: 'method', isStatic: true,
						signature: 'public static bool Seguro(Action a, string onde)', parameters: [{ name: 'a', type: 'Action' }, { name: 'onde', type: 'string' }],
						returns: { type: 'bool' },
					},
				],
			},
			{
				id: 'T:PBSLoaderCommonUtils.Fase', name: 'Fase', fullName: 'PBSLoaderCommonUtils.Fase', namespace: 'PBSLoaderCommonUtils',
				kind: 'enum', signature: 'public enum Fase', docs: { summary: 'Parte do jogo.' },
				members: [
					{ id: 'F:PBSLoaderCommonUtils.Fase.Menu', name: 'Menu', kind: 'value', signature: 'Menu = 0', value: '0', isStatic: true, docs: { summary: 'No menu | principal.' } },
					{ id: 'F:PBSLoaderCommonUtils.Fase.Dirigindo', name: 'Dirigindo', kind: 'value', signature: 'Dirigindo = 3', value: '3', isStatic: true },
				],
			},
			{
				id: 'T:PBSLoaderCommonUtils.Veiculos.Veiculo', name: 'Veiculo', fullName: 'PBSLoaderCommonUtils.Veiculos.Veiculo',
				namespace: 'PBSLoaderCommonUtils.Veiculos', kind: 'class', signature: 'public static class Veiculo', members: [],
			},
			{
				id: 'T:PBSLoaderCommonUtils.Veiculos.Veiculo.Motor', name: 'Veiculo.Motor', fullName: 'PBSLoaderCommonUtils.Veiculos.Veiculo.Motor',
				namespace: 'PBSLoaderCommonUtils.Veiculos', kind: 'class', declaringType: 'PBSLoaderCommonUtils.Veiculos.Veiculo',
				signature: 'public static class Motor', docs: { summary: 'Motor do ônibus.' },
				members: [{ id: 'P:PBSLoaderCommonUtils.Veiculos.Veiculo.Motor.Rpm', name: 'Rpm', kind: 'property', signature: 'public static float Rpm { get; }', isStatic: true }],
			},
			{
				id: 'T:PBSLoaderCommonUtils.Conteudo.ScriptDeOnibus', name: 'ScriptDeOnibus', fullName: 'PBSLoaderCommonUtils.Conteudo.ScriptDeOnibus',
				namespace: 'PBSLoaderCommonUtils.Conteudo', kind: 'class', baseType: 'Script', obsolete: 'Use outro.',
				signature: 'public abstract class ScriptDeOnibus : Script', docs: { typeParameters: { T: 'O tipo.' } },
				members: [
					{
						id: 'M:PBSLoaderCommonUtils.Conteudo.ScriptDeOnibus.Ativar(PBSLoaderCommonUtils.Fase)', name: 'Ativar', kind: 'method',
						signature: 'public virtual void Ativar(Fase fase)', parameters: [{ name: 'fase', type: 'Fase', description: 'A fase.' }],
					},
				],
			},
			{
				id: 'T:Outro.Global', name: 'Global', fullName: 'Outro.Global', namespace: 'Outro', kind: 'struct', signature: 'public struct Global',
				baseType: 'Desconhecido', members: [{ id: 'F:Outro.Global.X', name: 'X', kind: 'field', signature: 'public float X', isStatic: false }],
			},
			{ id: 'T:SemNamespace', name: 'SemNamespace', fullName: 'SemNamespace', kind: 'delegate', signature: 'public delegate void SemNamespace()', members: [] },
		],
		...overrides,
	};
}

export function interfaceDocument() {
	return {
		schema: 1,
		assembly: 'PBSLoaderCommonInterface',
		version: '0.4.0',
		types: [
			{ id: 'T:PBSLoaderCommonInterface.Hud', name: 'Hud', fullName: 'PBSLoaderCommonInterface.Hud', namespace: 'PBSLoaderCommonInterface', kind: 'class', signature: 'public static class Hud', members: [] },
			// Mesmo nome curto de um tipo da outra biblioteca: o link pelo nome curto fica ambíguo e não é gerado.
			{ id: 'T:PBSLoaderCommonInterface.Fase', name: 'Fase', fullName: 'PBSLoaderCommonInterface.Fase', namespace: 'PBSLoaderCommonInterface', kind: 'enum', signature: 'public enum Fase', members: [] },
		],
	};
}
