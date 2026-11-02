import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const schema = readFileSync(path.join(root, 'api/prisma/schema.prisma'), 'utf8')
const docsDir = path.join(root, 'docs')

const groups = [
  { id: 'leads', title: 'Leads e atendimento', subtitle: 'Distribuição, vendedor responsável, histórico e interesses.', models: ['Lead', 'Company', 'User', 'Vehicle', 'LeadStatus', 'LeadInteraction', 'LeadFollowup', 'LeadTag', 'LeadTagRelation', 'LeadVehicleInterest'] },
  { id: 'veiculos', title: 'Veículos e catálogo', subtitle: 'Estoque, marca, modelo, fotos e características.', models: ['Vehicle', 'Company', 'Category', 'Brand', 'Model', 'Fuel', 'Transmission', 'VehicleImage', 'Feature', 'VehicleFeature', 'FeaturedVehicle', 'VehicleView', 'Search'] },
  { id: 'lojas', title: 'Lojas e site', subtitle: 'Dono, equipe, aparência, páginas e manutenção.', models: ['Company', 'User', 'SiteSettings', 'SeoSettings', 'CompanyLocation', 'Banner', 'Page', 'SiteMaintenanceEvent', 'StoreAuditLog'] },
  { id: 'plataforma', title: 'Plataforma', subtitle: 'Administração global, assinaturas e demonstrações.', models: ['CompanySubscription', 'PlatformUser', 'PlatformAuditLog', 'DemoRequest', 'Plan', 'Company'] },
]

const scalarTypes = new Set(['String', 'Int', 'BigInt', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes'])
const models = [...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map((match) => {
  const [, name, body] = match
  const table = body.match(/@@map\("([^"]+)"\)/)?.[1] ?? name
  const fields = []
  const relationDefinitions = []

  for (const line of body.split('\n')) {
    const parsed = line.match(/^\s{2}(\w+)\s+([\w?\[\]]+)(.*)$/)
    if (!parsed) continue
    const [, fieldName, rawType, attributes] = parsed
    const type = rawType.replace(/[?\[\]]/g, '')
    const relation = attributes.match(/@relation\((?:"[^"]+",\s*)?fields:\s*\[([^\]]+)\]/)
    if (relation) relationDefinitions.push({ to: type, sourceField: relation[1].trim() })
    if (!scalarTypes.has(type)) continue
    fields.push({
      prismaName: fieldName,
      name: attributes.match(/@map\("([^"]+)"\)/)?.[1] ?? fieldName,
      type: rawType,
      primary: /@id\b/.test(attributes),
      unique: /@unique\b/.test(attributes),
      optional: rawType.endsWith('?'),
      foreign: false,
    })
  }

  const compositeId = body.match(/@@id\(\[([^\]]+)\]/)?.[1].split(',').map((field) => field.trim()) ?? []
  for (const field of fields) if (compositeId.includes(field.prismaName)) field.primary = true
  const relations = relationDefinitions.map((relation) => {
    const column = fields.find((field) => field.prismaName === relation.sourceField)
    if (!column) throw new Error(`Coluna de relação não encontrada: ${name}.${relation.sourceField}`)
    column.foreign = true
    return { from: name, to: relation.to, field: column.name, optional: column.optional, unique: column.unique }
  })
  return { name, table, fields, relations }
})

const modelByName = new Map(models.map((model) => [model.name, model]))
const relations = models.flatMap((model) => model.relations).filter((relation) => modelByName.has(relation.to))
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

const markdown = `# Banco de dados do Cartalog

Fonte: [schema Prisma](../api/prisma/schema.prisma). Abra o [explorador visual](banco-de-dados.html) para seguir cada chave estrangeira, copie o [DBML para dbdiagram](banco-de-dados.dbml) ou consulte o [SQL PostgreSQL](banco-de-dados.sql).

O SQL representa a estrutura de um banco vazio. Para atualizar bancos existentes, use as migrações em \`api/prisma/migrations\`.

${groups.map((group) => {
  const names = new Set(group.models)
  const entities = group.models.map((name) => {
    const model = modelByName.get(name)
    const keys = model.fields.filter((field) => field.primary || field.foreign)
    return `  ${model.table} {\n${keys.map((field) => `    ${field.type.replace(/[?\[\]]/g, '')} ${field.name}${field.primary ? ' PK' : field.foreign ? ' FK' : ''}`).join('\n')}\n  }`
  })
  const links = relations.filter((relation) => names.has(relation.from) && names.has(relation.to)).map((relation) => {
    const parent = modelByName.get(relation.to)
    const child = modelByName.get(relation.from)
    return `  ${parent.table} ||--${relation.unique ? 'o|' : 'o{'} ${child.table} : "${relation.field}"`
  })
  return `## ${group.title}\n\n${group.subtitle}\n\n\`\`\`mermaid\nerDiagram\n${[...entities, ...links].join('\n')}\n\`\`\``
}).join('\n\n')}

## Regenerar

Na pasta \`api\`, execute \`npm run docs:db\` para atualizar o SQL, esta referência e a página visual após alterar o schema Prisma.
`

const groupTabs = groups.map((group) => `<button class="domain-tab" type="button" data-domain="${group.id}"><span>${escape(group.title)}</span><small>${group.models.length} tabelas</small></button>`).join('')
const initialModel = modelByName.get('Lead')
const data = JSON.stringify({ groups, models }).replace(/</g, '\\u003c')

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Banco de dados · Cartalog</title>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#222126;background:#f5f4f3}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}button,input{font:inherit}button{cursor:pointer}.wrap{max-width:1480px;margin:auto;padding:0 32px}.top{height:68px;background:#19191d;border-bottom:3px solid #d50927;color:#fff}.top .wrap{height:100%;display:flex;align-items:center;justify-content:space-between}.brand{font-size:19px;font-weight:800;letter-spacing:-.04em}.brand i{display:inline-grid;place-items:center;background:#d50927;border-radius:8px;width:28px;height:28px;margin-right:9px;font-style:normal;font-size:16px}.brand small{font-size:12px;color:#9e9aa0;font-weight:500;letter-spacing:0}.top a{color:#ddd9df;text-decoration:none;font-size:13px;margin-left:18px}.top a:hover{color:white}.hero{background:linear-gradient(125deg,#fff 50%,#fff1f3);padding:55px 0 45px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:.14em;color:#c80020;text-transform:uppercase}.hero h1{font-size:clamp(37px,5vw,59px);line-height:1.07;letter-spacing:-.055em;margin:12px 0 16px;max-width:850px}.hero p{color:#68636b;font-size:16px;line-height:1.65;max-width:830px;margin:0}.hero-actions{display:flex;gap:11px;flex-wrap:wrap;margin-top:25px}.button{display:inline-flex;align-items:center;text-decoration:none;background:#d50927;color:white;border-radius:9px;padding:12px 16px;font-size:13px;font-weight:700}.button.secondary{background:#fff;color:#272329;border:1px solid #ded9dd}.stats{display:flex;flex-wrap:wrap;gap:25px;margin-top:31px;font-size:12px;color:#777178}.stats b{font-size:21px;color:#222126;margin-right:6px}.section{padding-top:42px}.section-head h2{font-size:29px;letter-spacing:-.04em;margin:7px 0}.section-head p{color:#78727a;margin:0;line-height:1.5}.domain-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 0}.domain-tab{background:#fff;border:1px solid #e0dce0;border-radius:10px;color:#4d474e;text-align:left;padding:12px 15px;min-width:178px;display:flex;flex-direction:column;gap:4px}.domain-tab span{font-size:13px;font-weight:700}.domain-tab small{font-size:11px;color:#89838a}.domain-tab.active{background:#d50927;border-color:#d50927;color:#fff}.domain-tab.active small{color:#ffd9df}.explorer{display:grid;grid-template-columns:245px minmax(0,1fr);gap:19px;margin-top:18px;align-items:start}.sidebar,.workspace{background:white;border:1px solid #e2dee1;border-radius:14px}.sidebar{padding:17px;position:sticky;top:18px}.sidebar label{display:block;font-size:11px;color:#8a828b;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px}.table-search{width:100%;border:1px solid #ded9dd;border-radius:8px;padding:10px 11px;font-size:12px;outline:none}.table-search:focus{border-color:#cc0a28}.table-list{display:flex;flex-direction:column;gap:4px;margin-top:12px;max-height:600px;overflow:auto}.table-choice{border:0;background:transparent;text-align:left;border-radius:7px;padding:9px 10px;color:#514d53;font:600 12px ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.table-choice:hover{background:#f7f3f4}.table-choice.active{background:#fbe6e9;color:#be0925}.empty-search{color:#918a91;font-size:12px;padding:10px}.workspace{min-height:600px;padding:27px}.focus-heading{display:flex;align-items:start;justify-content:space-between;gap:15px;border-bottom:1px solid #eee9ed;padding-bottom:22px}.focus-heading h3{font-size:28px;letter-spacing:-.045em;margin:6px 0}.focus-heading p{margin:0;color:#807a81;font-size:13px}.focus-count{background:#f6f3f4;border:1px solid #e9e4e7;border-radius:8px;padding:8px 11px;font-size:11px;color:#6f6970;white-space:nowrap}.guide{background:#f9f7f7;border:1px solid #e8e2e5;border-radius:9px;margin-top:22px;padding:12px 15px;color:#6b636c;font-size:12px;line-height:1.5}.relation-map{display:grid;grid-template-columns:minmax(190px,1fr) minmax(270px,1.45fr) minmax(190px,1fr);gap:18px;align-items:start;margin-top:22px}.column-label{display:block;text-transform:uppercase;color:#9a929a;font-size:10px;letter-spacing:.12em;font-weight:800;margin-bottom:11px}.relation-list{display:flex;flex-direction:column;gap:10px}.connection{width:100%;text-align:left;border:1px solid #e4dfe3;background:#fff;border-radius:10px;padding:13px 14px;transition:border-color .15s,box-shadow .15s}.connection:hover{border-color:#d50927;box-shadow:0 5px 15px #99102316}.connection strong{display:block;color:#242127;font-size:13px;overflow-wrap:anywhere}.connection .mapping{display:block;font:11px ui-monospace,SFMono-Regular,Consolas,monospace;color:#bd1230;margin-top:8px;line-height:1.5;overflow-wrap:anywhere}.connection .cardinality{display:block;color:#8e858e;font-size:10px;margin-top:8px}.no-relations{border:1px dashed #ded8dd;border-radius:10px;color:#918991;padding:17px;font-size:12px;line-height:1.5}.focus-card{border:2px solid #d50927;border-radius:12px;overflow:hidden;box-shadow:0 7px 24px #92112817}.focus-card-head{background:#d50927;color:#fff;padding:15px 18px}.focus-card-head strong{display:block;font-size:16px}.focus-card-head small{font-size:11px;color:#ffdee3}.field-list{max-height:515px;overflow:auto}.field-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #f1eef0;padding:8px 15px;font-size:11px}.field-row:last-child{border-bottom:0}.field-row span{display:flex;align-items:center;min-width:0;overflow-wrap:anywhere}.field-row code{font:11px ui-monospace,SFMono-Regular,Consolas,monospace}.field-row small{color:#9a939a;white-space:nowrap}.badge{display:inline-block;color:#c8132e;font-size:9px;font-weight:800;min-width:25px;margin-right:7px}.badge.fk{color:#80558c}.badge.none{color:#c8c1c6}.legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:16px;color:#8d858d;font-size:11px}.schema-note{margin:34px 0 60px;padding:17px 19px;border:1px solid #e8d9b6;background:#fff9ec;color:#655434;border-radius:10px;font-size:12px;line-height:1.6}.foot{border-top:1px solid #e4dfe2;padding:25px 0;color:#918990;font-size:12px}.foot .wrap{display:flex;justify-content:space-between;gap:15px}@media(max-width:1150px){.relation-map{grid-template-columns:1fr 1.25fr}.relation-map .right{grid-column:1/-1}.relation-map .right .relation-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.wrap{padding:0 18px}.top .wrap{gap:10px}.top a{margin-left:8px}.brand small{display:none}.explorer{grid-template-columns:1fr}.sidebar{position:static}.table-list{max-height:220px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.workspace{padding:18px}.relation-map{grid-template-columns:1fr}.relation-map .right{grid-column:auto}.relation-map .right .relation-list{display:flex}.focus-card{grid-row:1}.hero{padding:43px 0}.focus-heading{flex-direction:column}.foot .wrap{flex-direction:column}}@media(max-width:460px){.top a:first-child{display:none}.domain-tab{min-width:calc(50% - 4px);flex:1}.table-list{grid-template-columns:1fr}.stats{gap:12px}}
    @media(min-width:1001px){.explorer{grid-template-columns:220px minmax(0,1fr)}.relation-map{grid-template-columns:minmax(180px,1fr) minmax(245px,1.25fr) minmax(180px,1fr)}.relation-map .right{grid-column:auto}.relation-map .right .relation-list{display:flex;flex-direction:column}}
  </style>
</head>
<body>
  <header class="top"><div class="wrap"><div class="brand"><i>▣</i>Cartalog <small>/ banco de dados</small></div><nav><a href="/docs">Rotas da API</a><a href="banco-de-dados.sql" download="cartalog-schema.sql">Baixar SQL</a></nav></div></header>
  <section class="hero"><div class="wrap"><span class="eyebrow">PostgreSQL · schema Prisma</span><h1>Entenda cada ligação do banco, uma tabela por vez.</h1><p>Escolha uma área e uma tabela. À esquerda estão as tabelas que ela referencia; à direita, as tabelas que dependem dela. Cada ligação mostra a coluna exata da chave estrangeira.</p><div class="hero-actions"><a class="button" href="#explorador">Explorar relações ↓</a><a class="button secondary" href="banco-de-dados.dbml">Código para dbdiagram</a><a class="button secondary" href="banco-de-dados.sql" download="cartalog-schema.sql">Baixar SQL do schema</a></div><div class="stats"><span><b>${models.length}</b> tabelas</span><span><b>${relations.length}</b> chaves estrangeiras</span><span><b>${groups.length}</b> áreas</span></div></div></section>
  <main class="wrap"><section class="section" id="explorador"><div class="section-head"><span class="eyebrow">Mapa de relações</span><h2>Explore por área</h2><p id="domain-description">Distribuição, vendedor responsável, histórico e interesses.</p></div><div class="domain-tabs" role="tablist" aria-label="Áreas do banco">${groupTabs}</div><div class="explorer"><aside class="sidebar"><label for="table-search">Tabelas desta área</label><input class="table-search" id="table-search" type="search" placeholder="Buscar tabela ou coluna…"><div class="table-list" id="table-list"></div></aside><section class="workspace" aria-live="polite"><div class="focus-heading"><div><span class="eyebrow">Tabela selecionada</span><h3 id="focus-title">${escape(initialModel.table)}</h3><p id="focus-subtitle">${escape(initialModel.name)}</p></div><span class="focus-count" id="focus-count"></span></div><div class="guide">Leia cada vínculo como <strong>tabela.coluna FK → tabela.id PK</strong>. Selecione um cartão para seguir até a tabela ligada.</div><div class="relation-map"><div class="left"><span class="column-label">← Esta tabela aponta para</span><div class="relation-list" id="parents"></div></div><div class="center"><span class="column-label">Tabela em foco</span><div class="focus-card"><div class="focus-card-head"><strong id="card-title"></strong><small id="card-model"></small></div><div class="field-list" id="fields"></div></div></div><div class="right"><span class="column-label">Outras tabelas apontam para ela →</span><div class="relation-list" id="children"></div></div></div><div class="legend"><span><b class="badge">PK</b> chave primária</span><span><b class="badge fk">FK</b> chave estrangeira</span><span>O ? indica campo opcional</span></div></section></div><div class="schema-note"><strong>Fonte:</strong> <code>api/prisma/schema.prisma</code>. O SQL mostra como criar a estrutura em um banco vazio. Para atualizar um banco que já contém dados, aplique as migrações Prisma do projeto.</div></section></main><footer class="foot"><div class="wrap"><span>Cartalog · arquitetura de dados</span><span>Gerado a partir do schema Prisma</span></div></footer>
  <script>
    const data = ${data};
    const models = new Map(data.models.map(model => [model.name, model]));
    const relations = data.models.flatMap(model => model.relations);
    let activeGroup = data.groups[0];
    let activeModel = '${initialModel.name}';
    const byId = id => document.getElementById(id);
    const safe = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

    function selectModel(name) {
      if (!activeGroup.models.includes(name)) {
        activeGroup = data.groups.find(group => group.models.includes(name)) || activeGroup;
        byId('table-search').value = '';
      }
      activeModel = name;
      render();
    }

    function renderConnections(targetId, connections, direction) {
      const target = byId(targetId);
      target.replaceChildren();
      if (!connections.length) {
        const empty = document.createElement('div');
        empty.className = 'no-relations';
        empty.textContent = direction === 'parent' ? 'Esta tabela não possui chaves estrangeiras.' : 'Nenhuma outra tabela desta área aponta para ela.';
        target.append(empty);
        return;
      }
      for (const relation of connections) {
        const otherName = direction === 'parent' ? relation.to : relation.from;
        const other = models.get(otherName);
        const current = models.get(activeModel);
        const source = models.get(relation.from);
        const parent = models.get(relation.to);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'connection';
        button.innerHTML = '<strong>' + safe(other.table) + '</strong><span class="mapping">' + safe(source.table + '.' + relation.field + ' → ' + parent.table + '.id') + '</span><span class="cardinality">' + (relation.unique ? '1:1' : direction === 'parent' ? 'N:1' : '1:N') + (relation.optional ? ' · vínculo opcional' : ' · vínculo obrigatório') + '</span>';
        button.setAttribute('aria-label', 'Abrir ' + other.table);
        button.addEventListener('click', () => selectModel(otherName));
        target.append(button);
      }
    }

    function render() {
      document.querySelectorAll('.domain-tab').forEach(tab => {
        const selected = tab.dataset.domain === activeGroup.id;
        tab.classList.toggle('active', selected);
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', String(selected));
      });
      byId('domain-description').textContent = activeGroup.subtitle;
      const query = byId('table-search').value.trim().toLowerCase();
      const visible = activeGroup.models.filter(name => {
        const model = models.get(name);
        return (model.name + ' ' + model.table + ' ' + model.fields.map(field => field.name).join(' ')).toLowerCase().includes(query);
      });
      const list = byId('table-list');
      list.replaceChildren();
      for (const name of visible) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'table-choice' + (name === activeModel ? ' active' : '');
        button.textContent = models.get(name).table;
        button.addEventListener('click', () => selectModel(name));
        list.append(button);
      }
      if (!visible.length) list.innerHTML = '<span class="empty-search">Nenhuma tabela encontrada.</span>';
      const model = models.get(activeModel);
      const parents = model.relations.filter(relation => activeGroup.models.includes(relation.to));
      const children = relations.filter(relation => relation.to === activeModel && activeGroup.models.includes(relation.from));
      byId('focus-title').textContent = model.table;
      byId('focus-subtitle').textContent = model.name + ' · ' + model.fields.length + ' colunas';
      byId('focus-count').textContent = (parents.length + children.length) + ' relações nesta área';
      byId('card-title').textContent = model.table;
      byId('card-model').textContent = model.name;
      byId('fields').innerHTML = model.fields.map(field => '<div class="field-row"><span><b class="badge ' + (field.primary ? '' : field.foreign ? 'fk' : 'none') + '">' + (field.primary ? 'PK' : field.foreign ? 'FK' : '·') + '</b><code>' + safe(field.name) + '</code></span><small>' + safe(field.type) + '</small></div>').join('');
      renderConnections('parents', parents, 'parent');
      renderConnections('children', children, 'child');
    }

    document.querySelectorAll('.domain-tab').forEach(tab => tab.addEventListener('click', () => {
      activeGroup = data.groups.find(group => group.id === tab.dataset.domain);
      activeModel = activeGroup.models[0];
      byId('table-search').value = '';
      render();
    }));
    byId('table-search').addEventListener('input', render);
    render();
  </script>
</body>
</html>`

writeFileSync(path.join(docsDir, 'banco-de-dados.html'), html, 'utf8')
writeFileSync(path.join(docsDir, 'BANCO-DE-DADOS.md'), markdown, 'utf8')
console.log(`Documentação gerada: ${models.length} tabelas, ${relations.length} relações`)
