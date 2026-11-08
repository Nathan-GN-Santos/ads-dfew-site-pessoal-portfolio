/* =========================================================
   js/scripts.js — Portfólio acadêmico (CP3)

   COMO EDITAR:
   - Tudo que é configurável está no objeto CONFIG logo abaixo.
   - Há 3 módulos independentes: tema, formulário e canvas.
     Cada um só roda se os elementos dele existirem na página.
   - Este arquivo é carregado nas 5 páginas com "defer".
   ========================================================= */
(function () {
    'use strict';

    /* =====================================================
       CONFIG — valores que você pode querer mudar
       ===================================================== */
    const CONFIG = {
        // Chaves do localStorage 
        chaves: {
            tema: 'portfolio:tema',
            rascunho: 'portfolio:formulario:rascunho',
            historico: 'portfolio:formulario:historico'
        },

        // Tema
        tema: {
            escuro: 'dark',
            claro: 'light',
            evento: 'temamudou' // evento disparado no document ao trocar o tema
        },

        // Onda do botão de tema (a duração vem da variável CSS --onda-duracao;
       
        onda: {
            duracaoPadraoMs: 700,
            duracaoMaxMs: 800,
            proporcaoCobrir: 0.6 // parte da duração gasta crescendo; o resto dissolvendo
        },

        // Formulário
        formulario: {
            debounceRascunhoMs: 300,
            historicoMax: 5,
            nomeMin: 3,
            mensagemMin: 10,
            mensagemMax: 1000,
            telefoneDigitosPermitidos: [10, 11],
            locale: 'pt-BR'
        },

        // Desenho do canvas 
        canvas: {
            forma: { x: 20, y: 20, largura: 100, altura: 100 },
            texto: { conteudo: 'Canvas OK!', x: 140, y: 75, fonte: '16px Montserrat, sans-serif' }
        },

        // Textos exibidos ao usuário ({chaves} são substituídas pelo código)
        mensagens: {
            nomeVazio: 'Informe seu nome completo.',
            nomeCurto: 'O nome precisa ter pelo menos {min} caracteres.',
            emailVazio: 'Informe seu e-mail.',
            emailInvalido: 'Digite um e-mail válido, por exemplo nome@exemplo.com.',
            telefoneInvalido: 'Digite o telefone com DDD: 10 ou 11 dígitos.',
            telefoneObrigatorio: 'Informe o telefone, pois você escolheu resposta por WhatsApp.',
            telefoneRotuloOpcional: '(opcional)',
            telefoneRotuloObrigatorio: '(obrigatório para WhatsApp)',
            dataPassada: 'A data de retorno não pode ser anterior a hoje.',
            assuntoVazio: 'Selecione um assunto.',
            mensagemVazia: 'Escreva sua mensagem.',
            mensagemCurta: 'A mensagem precisa ter pelo menos {min} caracteres.',
            mensagemLonga: 'A mensagem pode ter no máximo {max} caracteres.',
            sucesso: 'Mensagem enviada com sucesso! Obrigado, {nome}.',
            semArmazenamento: 'Não foi possível salvar neste navegador (o armazenamento local está bloqueado).'
        }
    };

    /* =====================================================
       UTILITÁRIOS
       ===================================================== */

    // Acesso protegido ao localStorage (pode estar bloqueado ou cheio)
    const armazenamento = {
        lerTexto(chave) {
            try {
                return window.localStorage.getItem(chave);
            } catch (erro) {
                return null;
            }
        },
        salvarTexto(chave, valor) {
            try {
                window.localStorage.setItem(chave, valor);
                return true;
            } catch (erro) {
                return false;
            }
        },
        lerJson(chave, padrao) {
            const bruto = this.lerTexto(chave);
            if (bruto === null) return padrao;
            try {
                return JSON.parse(bruto); // JSON.parse protegido
            } catch (erro) {
                return padrao;
            }
        },
        salvarJson(chave, valor) {
            return this.salvarTexto(chave, JSON.stringify(valor));
        },
        remover(chave) {
            try {
                window.localStorage.removeItem(chave);
                return true;
            } catch (erro) {
                return false;
            }
        }
    };

    function reduzMovimento() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Troca {chave} por valores: formatar('Olá {nome}', { nome: 'Ana' })
    function formatar(modelo, valores) {
        return modelo.replace(/\{(\w+)\}/g, function (_, chave) {
            return chave in valores ? valores[chave] : '';
        });
    }

    // Executa a função só depois de "ms" sem novas chamadas
    function debounce(funcao, ms) {
        let temporizador = null;
        const envolvida = function () {
            const args = arguments;
            clearTimeout(temporizador);
            temporizador = setTimeout(function () {
                funcao.apply(null, args);
            }, ms);
        };
        envolvida.cancelar = function () {
            clearTimeout(temporizador);
        };
        return envolvida;
    }

    /* =====================================================
       MÓDULO 1 — TEMA CLARO/ESCURO COM ONDA
       ===================================================== */
    function moduloTema() {
        const botao = document.getElementById('botao-tema');
        if (!botao) return;

        const raiz = document.documentElement;
        const claro = CONFIG.tema.claro;
        const escuro = CONFIG.tema.escuro;
        let animando = false;

        function temaAtual() {
            return raiz.getAttribute('data-theme') === claro ? claro : escuro;
        }

        
        function garantirTemaInicial() {
            const atual = raiz.getAttribute('data-theme');
            if (atual === claro || atual === escuro) return;
            const salvo = armazenamento.lerTexto(CONFIG.chaves.tema);
            let tema = salvo;
            if (tema !== claro && tema !== escuro) {
                tema = window.matchMedia('(prefers-color-scheme: light)').matches ? claro : escuro;
            }
            raiz.setAttribute('data-theme', tema);
        }

        // Atualiza aria-pressed (true = modo escuro ativo), aria-label e <meta theme-color>
        function sincronizarBotao() {
            const escuroAtivo = temaAtual() === escuro;
            botao.setAttribute('aria-pressed', String(escuroAtivo));
            botao.setAttribute('aria-label', escuroAtivo
                ? 'Alternar para o modo claro'
                : 'Alternar para o modo escuro');

            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                const cor = getComputedStyle(raiz).getPropertyValue('--cor-header-fundo').trim();
                if (cor) meta.setAttribute('content', cor);
            }
        }

        function aplicarTema(tema) {
            raiz.setAttribute('data-theme', tema);
            armazenamento.salvarTexto(CONFIG.chaves.tema, tema);
            sincronizarBotao();
            document.dispatchEvent(new CustomEvent(CONFIG.tema.evento, { detail: { tema: tema } }));
        }

        // Lê --onda-duracao 
        function lerDuracaoCss() {
            const bruto = getComputedStyle(raiz).getPropertyValue('--onda-duracao').trim();
            const numero = parseFloat(bruto);
            if (Number.isNaN(numero)) return CONFIG.onda.duracaoPadraoMs;
            if (bruto.slice(-2) === 'ms') return numero;
            if (bruto.slice(-1) === 's') return numero * 1000;
            return CONFIG.onda.duracaoPadraoMs;
        }

        function trocarTema() {
            if (animando) return; // bloqueia cliques durante a animação

            const novo = temaAtual() === escuro ? claro : escuro;
            //const semAnimacao = reduzMovimento() || typeof Element.prototype.animate !== 'function';
              const semAnimacao = typeof Element.prototype.animate !== 'function';
            if (semAnimacao) {
                aplicarTema(novo);
                return;
            }

            animando = true;

            // Centro do botão e raio até o canto mais distante da tela
            const caixa = botao.getBoundingClientRect();
            const cx = caixa.left + caixa.width / 2;
            const cy = caixa.top + caixa.height / 2;
            const larg = raiz.clientWidth;
            const alt = raiz.clientHeight;
            const raio = Math.hypot(Math.max(cx, larg - cx), Math.max(cy, alt - cy));

            const total = Math.min(lerDuracaoCss(), CONFIG.onda.duracaoMaxMs);
            const tempoCobrir = total * CONFIG.onda.proporcaoCobrir;
            const tempoDissolver = total - tempoCobrir;

            const onda = document.createElement('div');
            onda.className = 'onda';
            onda.setAttribute('aria-hidden', 'true');
            const inicio = 'circle(0px at ' + cx + 'px ' + cy + 'px)';
            const fim = 'circle(' + raio + 'px at ' + cx + 'px ' + cy + 'px)';
            onda.style.clipPath = inicio;
            document.body.appendChild(onda);

            function finalizar() {
                onda.remove();
                animando = false;
            }

            // Fase 1: a onda cresce até cobrir a tela
            onda.animate(
                [{ clipPath: inicio }, { clipPath: fim }],
                { duration: tempoCobrir, easing: 'ease-in', fill: 'forwards' }
            ).finished
                .then(function () {
                    // Fase 2: com a tela coberta, troca o tema e dissolve a onda
                    aplicarTema(novo);
                    onda.style.clipPath = fim;
                    return onda.animate(
                        [{ opacity: 1 }, { opacity: 0 }],
                        { duration: tempoDissolver, easing: 'ease-out', fill: 'forwards' }
                    ).finished;
                })
                .then(finalizar, finalizar);
        }

        garantirTemaInicial();
        sincronizarBotao();
        botao.addEventListener('click', trocarTema);
    }

    /* =====================================================
       MÓDULO 2 — FORMULÁRIO (validação, rascunho e histórico)
       ===================================================== */
    function moduloFormulario() {
        const form = document.getElementById('form-contato');
        if (!form) return;

        const F = CONFIG.formulario;
        const M = CONFIG.mensagens;
        const CAMPOS = ['nome', 'email', 'telefone', 'data_contato', 'assunto', 'mensagem']; // ordem do Tab

        const campos = {};
        CAMPOS.forEach(function (id) {
            campos[id] = document.getElementById(id);
        });
        if (CAMPOS.some(function (id) { return !campos[id]; })) return;

        const radios = Array.prototype.slice.call(form.querySelectorAll('input[name="preferencia"]'));
        const newsletter = document.getElementById('newsletter');
        const contador = document.getElementById('mensagem-contador');
        const rotuloTelefone = document.getElementById('telefone-opcional');

        const caixaSucesso = document.getElementById('msg-sucesso');
        const textoSucesso = document.getElementById('msg-sucesso-texto');
        const botaoFecharSucesso = document.getElementById('fechar-sucesso');

        const avisoRascunho = document.getElementById('aviso-rascunho');
        const botaoDescartar = document.getElementById('descartar-rascunho');

        const tituloHistorico = document.getElementById('historico-titulo');
        const listaHistorico = document.getElementById('historico-lista');
        const vazioHistorico = document.getElementById('historico-vazio');
        const erroHistorico = document.getElementById('historico-erro');
        const botaoLimpar = document.getElementById('limpar-historico');

        /* ---------- Funções de apoio ---------- */

        function preferenciaAtual() {
            const marcado = radios.filter(function (r) { return r.checked; })[0];
            return marcado ? marcado.value : 'email';
        }

        function soDigitos(texto) {
            return String(texto).replace(/\D/g, '');
        }

        // Máscara (11) 99999-9999 (ou (11) 9999-9999 com 10 dígitos)
        function mascararTelefone(valor) {
            const d = soDigitos(valor).slice(0, 11);
            if (d.length === 0) return '';
            if (d.length <= 2) return '(' + d;
            if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
            if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
            return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
        }

        function hojeISO() {
            const d = new Date();
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const dia = String(d.getDate()).padStart(2, '0');
            return d.getFullYear() + '-' + mes + '-' + dia;
        }

        function formatarData(iso) {
            const data = new Date(iso);
            if (Number.isNaN(data.getTime())) return '';
            return new Intl.DateTimeFormat(F.locale, { dateStyle: 'short', timeStyle: 'short' }).format(data);
        }

        function rotuloAssunto(valor) {
            const opcao = Array.prototype.slice.call(campos.assunto.options).filter(function (o) {
                return o.value === valor;
            })[0];
            return opcao ? opcao.textContent : String(valor || '');
        }

        function lerDados() {
            return {
                nome: campos.nome.value,
                email: campos.email.value,
                telefone: campos.telefone.value,
                data_contato: campos.data_contato.value,
                assunto: campos.assunto.value,
                mensagem: campos.mensagem.value,
                preferencia: preferenciaAtual(),
                newsletter: newsletter ? newsletter.checked : false
            };
        }

        function temConteudo(dados) {
            const textos = CAMPOS.some(function (id) {
                return typeof dados[id] === 'string' && dados[id].trim() !== '';
            });
            return textos || dados.newsletter === true;
        }

        /* ---------- Erros ---------- */

        function mostrarErro(id, texto) {
            const alvo = document.getElementById(id + '-erro');
            campos[id].setAttribute('aria-invalid', 'true');
            if (alvo) {
                alvo.textContent = texto; // textContent: nunca innerHTML
                alvo.hidden = false;
            }
        }

        function limparErro(id) {
            const alvo = document.getElementById(id + '-erro');
            campos[id].removeAttribute('aria-invalid');
            if (alvo) {
                alvo.textContent = '';
                alvo.hidden = true;
            }
        }

        function limparTodosErros() {
            CAMPOS.forEach(limparErro);
        }

        /* ---------- Validadores (retornam o texto do erro, ou '' se válido) ---------- */

        const validadores = {
            nome: function (valor) {
                const texto = valor.trim();
                if (!texto) return M.nomeVazio;
                if (texto.length < F.nomeMin) return formatar(M.nomeCurto, { min: F.nomeMin });
                return '';
            },
            email: function (valor) {
                const texto = valor.trim();
                if (!texto) return M.emailVazio;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto)) return M.emailInvalido;
                return '';
            },
            telefone: function (valor) {
                const digitos = soDigitos(valor);
                if (!digitos) return preferenciaAtual() === 'whatsapp' ? M.telefoneObrigatorio : '';
                return F.telefoneDigitosPermitidos.indexOf(digitos.length) !== -1 ? '' : M.telefoneInvalido;
            },
            data_contato: function (valor) {
                if (!valor) return '';
                return valor < hojeISO() ? M.dataPassada : '';
            },
            assunto: function (valor) {
                return valor ? '' : M.assuntoVazio;
            },
            mensagem: function (valor) {
                const texto = valor.trim();
                if (!texto) return M.mensagemVazia;
                if (texto.length < F.mensagemMin) return formatar(M.mensagemCurta, { min: F.mensagemMin });
                if (valor.length > F.mensagemMax) return formatar(M.mensagemLonga, { max: F.mensagemMax });
                return '';
            }
        };

        function validarCampo(id) {
            const erro = validadores[id](campos[id].value);
            if (erro) {
                mostrarErro(id, erro);
            } else {
                limparErro(id);
            }
            return !erro;
        }

        /* ---------- Interface auxiliar ---------- */

        function atualizarContador() {
            if (!contador) return;
            const tamanho = campos.mensagem.value.length;
            contador.textContent = tamanho + ' / ' + F.mensagemMax + ' caracteres';
            contador.classList.toggle('contador--excedido', tamanho > F.mensagemMax);
        }

        // WhatsApp torna o telefone obrigatório
        function atualizarRotuloTelefone() {
            const whatsapp = preferenciaAtual() === 'whatsapp';
            campos.telefone.required = whatsapp;
            if (rotuloTelefone) {
                rotuloTelefone.textContent = whatsapp ? M.telefoneRotuloObrigatorio : M.telefoneRotuloOpcional;
            }
        }

        /* ---------- Rascunho (localStorage) ---------- */

        const salvarRascunho = debounce(function () {
            const dados = lerDados();
            if (temConteudo(dados)) {
                armazenamento.salvarJson(CONFIG.chaves.rascunho, dados);
            } else {
                armazenamento.remover(CONFIG.chaves.rascunho);
            }
        }, F.debounceRascunhoMs);

        function restaurarRascunho() {
            const dados = armazenamento.lerJson(CONFIG.chaves.rascunho, null);
            if (!dados || typeof dados !== 'object' || !temConteudo(dados)) return;

            CAMPOS.forEach(function (id) {
                if (typeof dados[id] === 'string') campos[id].value = dados[id];
            });
            campos.telefone.value = mascararTelefone(campos.telefone.value);

            radios.forEach(function (radio) {
                radio.checked = radio.value === dados.preferencia;
            });
            if (!radios.some(function (r) { return r.checked; }) && radios[0]) radios[0].checked = true;
            if (newsletter) newsletter.checked = dados.newsletter === true;

            atualizarContador();
            atualizarRotuloTelefone();
            if (avisoRascunho) avisoRascunho.hidden = false;
        }

        function descartarRascunho() {
            salvarRascunho.cancelar();
            armazenamento.remover(CONFIG.chaves.rascunho);
            form.reset();
            limparTodosErros();
            atualizarContador();
            atualizarRotuloTelefone();
            if (avisoRascunho) avisoRascunho.hidden = true;
            campos.nome.focus();
        }

        /* ---------- Histórico (localStorage) ---------- */

        function lerHistorico() {
            const lista = armazenamento.lerJson(CONFIG.chaves.historico, []);
            if (!Array.isArray(lista)) return [];
            return lista.filter(function (item) {
                return item && typeof item === 'object';
            }).slice(0, F.historicoMax);
        }

        function adicionarAoHistorico(entrada) {
            const lista = lerHistorico();
            lista.unshift(entrada); // mais recente primeiro
            return armazenamento.salvarJson(CONFIG.chaves.historico, lista.slice(0, F.historicoMax));
        }

        function renderizarHistorico() {
            if (!listaHistorico) return;
            const lista = lerHistorico();
            listaHistorico.textContent = '';

            lista.forEach(function (item) {
                const li = document.createElement('li');
                li.className = 'historico__item';

                const topo = document.createElement('div');
                topo.className = 'historico__topo';

                const nome = document.createElement('strong');
                nome.textContent = String(item.nome || '');

                const assunto = document.createElement('span');
                assunto.className = 'historico__assunto';
                assunto.textContent = rotuloAssunto(item.assunto);

                const tempo = document.createElement('time');
                tempo.className = 'historico__data';
                if (item.data) tempo.setAttribute('datetime', String(item.data));
                tempo.textContent = formatarData(item.data);

                const mensagem = document.createElement('p');
                mensagem.className = 'historico__mensagem';
                mensagem.textContent = String(item.mensagem || '');

                topo.appendChild(nome);
                topo.appendChild(assunto);
                topo.appendChild(tempo);
                li.appendChild(topo);
                li.appendChild(mensagem);
                listaHistorico.appendChild(li);
            });

            const temItens = lista.length > 0;
            listaHistorico.hidden = !temItens;
            if (vazioHistorico) vazioHistorico.hidden = temItens;
            if (botaoLimpar) botaoLimpar.hidden = !temItens;
        }

        function mostrarAvisoArmazenamento(visivel) {
            if (!erroHistorico) return;
            erroHistorico.textContent = visivel ? M.semArmazenamento : '';
            erroHistorico.hidden = !visivel;
        }

        /* ---------- Sucesso ---------- */

        function esconderSucesso() {
            if (caixaSucesso) caixaSucesso.hidden = true;
        }

        function mostrarSucesso(nome) {
            if (!caixaSucesso || !textoSucesso) return;
            textoSucesso.textContent = formatar(M.sucesso, { nome: nome });
            caixaSucesso.hidden = true;
            void caixaSucesso.offsetWidth; // força o navegador a reiniciar a animação de entrada
            caixaSucesso.hidden = false;
            caixaSucesso.focus({ preventScroll: true });
            caixaSucesso.scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', block: 'start' });
        }

        /* ---------- Eventos ---------- */

        // Máscara do telefone
        campos.telefone.addEventListener('input', function () {
            campos.telefone.value = mascararTelefone(campos.telefone.value);
        });

        // Valida ao sair do campo; se já estava com erro, revalida enquanto digita
        CAMPOS.forEach(function (id) {
            const campo = campos[id];
            campo.addEventListener('blur', function () {
                validarCampo(id);
            });
            function revalidarSeComErro() {
                if (campo.getAttribute('aria-invalid') === 'true') validarCampo(id);
            }
            campo.addEventListener('input', revalidarSeComErro);
            campo.addEventListener('change', revalidarSeComErro);
        });

        campos.mensagem.addEventListener('input', atualizarContador);

        // Mudou a preferência de resposta: telefone pode virar obrigatório
        radios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                atualizarRotuloTelefone();
                if (campos.telefone.getAttribute('aria-invalid') === 'true') validarCampo('telefone');
            });
        });

        // Rascunho: salva enquanto digita (debounce)
        form.addEventListener('input', salvarRascunho);
        form.addEventListener('change', salvarRascunho);

        if (botaoDescartar) botaoDescartar.addEventListener('click', descartarRascunho);

        if (botaoFecharSucesso) {
            botaoFecharSucesso.addEventListener('click', function () {
                esconderSucesso();
                campos.nome.focus();
            });
        }

        if (botaoLimpar) {
            botaoLimpar.addEventListener('click', function () {
                armazenamento.remover(CONFIG.chaves.historico);
                renderizarHistorico();
                if (tituloHistorico) tituloHistorico.focus(); // o botão sumiu: devolve o foco
            });
        }

        // Envio
        form.addEventListener('submit', function (evento) {
            evento.preventDefault();
            esconderSucesso();

            let primeiroInvalido = null;
            CAMPOS.forEach(function (id) {
                if (!validarCampo(id) && !primeiroInvalido) primeiroInvalido = campos[id];
            });

            if (primeiroInvalido) {
                primeiroInvalido.focus(); // foco no primeiro campo com erro
                return;
            }

            const dados = lerDados();
            const nomeInformado = dados.nome.trim();

            // Limpa o rascunho e cancela qualquer salvamento pendente
            salvarRascunho.cancelar();
            armazenamento.remover(CONFIG.chaves.rascunho);

            // Guarda no histórico
            const salvou = adicionarAoHistorico({
                nome: nomeInformado,
                assunto: dados.assunto,
                mensagem: dados.mensagem.trim(),
                data: new Date().toISOString()
            });

            // Limpa o formulário
            form.reset();
            limparTodosErros();
            atualizarContador();
            atualizarRotuloTelefone();
            if (avisoRascunho) avisoRascunho.hidden = true;

            renderizarHistorico();
            mostrarAvisoArmazenamento(!salvou);
            mostrarSucesso(nomeInformado);
        });

        /* ---------- Início ---------- */
        campos.data_contato.min = hojeISO();
        atualizarContador();
        atualizarRotuloTelefone();
        restaurarRascunho();
        renderizarHistorico();

        // Teste rápido se o armazenamento local funciona
        const chaveTeste = 'portfolio:teste';
        const funciona = armazenamento.salvarTexto(chaveTeste, '1');
        armazenamento.remover(chaveTeste);
        mostrarAvisoArmazenamento(!funciona);
    }

    /* =====================================================
       MÓDULO 3 — CANVAS (graficos.html)
       ===================================================== */
    function moduloCanvas() {
        const canvas = document.getElementById('meuCanvas');
        if (!canvas || typeof canvas.getContext !== 'function') return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const C = CONFIG.canvas;

        function lerCor(nome) {
            return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
        }

       
        function desenhar() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = lerCor('--cor-canvas-forma');
            ctx.fillRect(C.forma.x, C.forma.y, C.forma.largura, C.forma.altura);

            ctx.fillStyle = lerCor('--cor-canvas-texto');
            ctx.font = C.texto.fonte;
            ctx.fillText(C.texto.conteudo, C.texto.x, C.texto.y);
        }

        desenhar();
        document.addEventListener(CONFIG.tema.evento, desenhar); // redesenha ao trocar o tema

        // Redesenha quando a fonte Montserrat terminar de carregar
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(desenhar);
        }
    }

    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */
    moduloTema();
    moduloFormulario();
    moduloCanvas();
})();