const uuid = "e0c71d1d-26f8-4ea0-b2dc-85fb14c8d5cf";

const menuLateral = document.querySelector('.sidebar');
const sombra = document.getElementById('sombra');
const botaoIcon = document.getElementById('botaoIcon');
const usuarios = document.querySelector('.usuarios');
const mensagemPublica = document.querySelector('.mensagem-publica');
const mensagemPrivada = document.querySelector('.mensagem-privada');
const contatoTodos = document.querySelector('.contato-todos');
const texto = document.querySelector(".texto");
let nomeUsuario;
let destinatarioSelecionado = "Todos";
let tipoMensagem = "message";
const mensagensExibidas = new Set();
let primeiraCarga = true;

botaoIcon.addEventListener('click', () => {
    menuLateral.classList.add('aberto');
    sombra.classList.add('aberto');
});

sombra.addEventListener('click', () => {
    menuLateral.classList.remove('aberto');
    sombra.classList.remove('aberto');
});

document.addEventListener('click', (event) => {
    if (!menuLateral.contains(event.target) && !botaoIcon.contains(event.target) && menuLateral.classList.contains('aberto')) {
        menuLateral.classList.remove('aberto');
        sombra.classList.remove('aberto');
    }
});

function atualizarTextoEnvio() {
    let visibilidadeTexto = tipoMensagem === 'message' ? 'público' : 'reservadamente';
    if (destinatarioSelecionado === 'Todos') {
        texto.textContent = `Enviando para Todos (${visibilidadeTexto})`;
    } else {
        texto.textContent = `Enviando para ${destinatarioSelecionado} (${visibilidadeTexto})`;
    }
}

function obterNomeUsuario() {
    nomeUsuario = prompt("Qual o seu nome?");
    if (nomeUsuario === null || nomeUsuario.trim() === "") {
        alert("Por favor, digite um nome válido.");
        obterNomeUsuario();
        return;
    }
    enviarNomeParaServidor(nomeUsuario);
    adicionarUsuarioNaLista(nomeUsuario);
    enviarMensagemEntrada(nomeUsuario);

    if (!document.querySelector('.contatos > div.selecionado')) {
        selecionarDestinatario('Todos');
    }
}

function enviarNomeParaServidor(nomeUsuario) {
    axios.post(`https://mock-api.driven.com.br/api/v6/uol/participants/${uuid}`, { name: nomeUsuario })
        .then(resposta => {
            console.log("Usuário cadastrado com sucesso:", resposta.data);
            carregarMensagens();
            buscarUsuariosOnline();
        })
        .catch(erro => {
            if (erro.response && erro.response.status === 400) {
                alert("Nome já em uso. Por favor, escolha outro.");
                obterNomeUsuario();
            } else {
                console.error("Erro ao cadastrar usuário:", erro);
                alert("Ocorreu um erro. Tente novamente mais tarde.");
            }
        });
}

function adicionarUsuarioNaLista(nomeUsuario) {
    console.log("Adicionando usuário:", nomeUsuario);
    const novoContato = document.createElement("div");
    novoContato.classList.add("usuarios-online");
    novoContato.innerHTML = `
        <ion-icon name="person-circle"></ion-icon>
        <p>${nomeUsuario}</p>
        <ion-icon name="checkmark-outline" class="check"></ion-icon>
    `;
    novoContato.addEventListener("click", () => selecionarDestinatario(nomeUsuario));
    usuarios.appendChild(novoContato);
}

function carregarMensagens() {
    axios.get(`https://mock-api.driven.com.br/api/v6/uol/messages/${uuid}`)
        .then(resposta => {
            const mensagensRecebidas = resposta.data;
            const container = document.getElementById("mensagens-container");
            let novasMensagens = false;

            mensagensRecebidas.forEach(mensagem => {
                const idMensagem = `${mensagem.time}-${mensagem.from}-${mensagem.to}-${mensagem.text}`;
                if (!mensagensExibidas.has(idMensagem)) {
                    mensagensExibidas.add(idMensagem);
                    novasMensagens = true;
                    const mensagemElemento = document.createElement("div");
                    mensagemElemento.classList.add("mensagem");

                    if (mensagem.type === "private_message") {
                        if (mensagem.to === nomeUsuario || mensagem.from === nomeUsuario || mensagem.to === "Todos") {
                            mensagemElemento.classList.add("privada");
                            mensagemElemento.innerHTML = `<span class="tempo"> (${mensagem.time}) </span>&nbsp;<strong> ${mensagem.from} </strong>&nbsp;reservadamente para&nbsp;<strong> ${mensagem.to} </strong>:&nbsp;${mensagem.text}`;
                            container.appendChild(mensagemElemento); // Adiciona a mensagem apenas se for visível
                        }
                    } else if (mensagem.type === "status") {
                        mensagemElemento.classList.add("status");
                        mensagemElemento.innerHTML = `<span class="tempo"> (${mensagem.time}) </span> <strong> ${mensagem.from}</strong>&nbsp;${mensagem.text}`;
                        container.appendChild(mensagemElemento);
                    } else if (mensagem.type === "message") {
                        mensagemElemento.classList.add("publica");
                        mensagemElemento.innerHTML = `<span class="tempo"> (${mensagem.time}) </span>&nbsp;<strong> ${mensagem.from} </strong>&nbsp;para&nbsp;<strong> ${mensagem.to} </strong>:&nbsp;${mensagem.text}`;
                        container.appendChild(mensagemElemento);
                    }
                }
            });

            if (primeiraCarga || novasMensagens) {
                rolarParaBaixo();
                primeiraCarga = false;
            }
        })
        .catch(erro => {
            console.error("Erro ao carregar mensagens:", erro);
        });
}

function rolarParaBaixo() {
    const container = document.getElementById("mensagens-container");
    
    if (!container) {
        console.error("Elemento mensagens-container não encontrado!");
        return;
    }
    setTimeout(() => {
        const ultimaMensagem = container.lastElementChild;
        if (ultimaMensagem) {
            ultimaMensagem.scrollIntoView({
                behavior: 'smooth',
                inline: 'nearest'
            });
        }
    }, 200); 
}

function buscarUsuariosOnline() {
    axios.get(`https://mock-api.driven.com.br/api/v6/uol/participants/${uuid}`)
        .then(resposta => {
            const usuarios = resposta.data;
            atualizarListaUsuariosOnline(usuarios);
        })
        .catch(erro => {
            console.error("Erro ao buscar usuários online:", erro);
        });
}

function atualizarListaUsuariosOnline(usuarios) {
    const usuariosExibidos = Array.from(usuarios.querySelectorAll('p')).map(p => p.textContent);

    usuariosExibidos.forEach(nome => {
        if (!usuarios.some(usuario => usuario.name === nome) && nome !== 'Todos') {
            console.log("Removendo usuário:", nome);
            const contatoRemover = Array.from(usuarios.querySelectorAll('.usuarios-online'))
                .find(contato => {
                    const paragrafo = contato.querySelector('p');
                    return paragrafo && paragrafo.textContent === nome;
                });

            if (contatoRemover) {
                contatoRemover.remove(); 
            }
        }
    });

    usuarios.forEach(usuario => {
        if (!usuariosExibidos.includes(usuario.name)) {
            console.log("Adicionando novo usuário:", usuario.name);
            adicionarUsuarioNaLista(usuario.name);
        }
    });
}

function enviarMensagem() {
    const inputMensagem = document.getElementById("escrever-mensagem");
    const mensagemTexto = inputMensagem.value.trim();

    if (mensagemTexto === "") {
        return;
    }

    const mensagem = {
        from: nomeUsuario,
        to: destinatarioSelecionado,
        text: mensagemTexto,
        type: tipoMensagem
    };

    axios.post(`https://mock-api.driven.com.br/api/v6/uol/messages/${uuid}`, mensagem)
        .then(() => {
            inputMensagem.value = "";
            carregarMensagens();
        })
        .catch((erro) => {
            console.error("Erro ao enviar mensagem:", erro);
            alert("Erro ao enviar mensagem. Você foi desconectado ou ocorreu um problema no servidor.");
            window.location.reload();
        });
}

function manterConexao() {
    axios.post(`https://mock-api.driven.com.br/api/v6/uol/status/${uuid}`, { name: nomeUsuario })
        .catch(() => {
            alert("Você foi desconectado. Recarregando a página...");
            window.location.reload();
        });
}

function selecionarDestinatario(destinatario) {
    destinatarioSelecionado = destinatario;
    atualizarTextoEnvio();

    const contatos = document.querySelectorAll('.contatos > div');
    contatos.forEach(contato => {
        const paragrafo = contato.querySelector('p');
        if (paragrafo && paragrafo.textContent === destinatario) {
            contato.classList.add('selecionado'); //escolhido
            
        } else {
            contato.classList.remove('selecionado');
        }
    });
}

function selecionarVisibilidade(visibilidade) {
    tipoMensagem = visibilidade;
    atualizarTextoEnvio();

    const visibilidades = document.querySelectorAll('.visibilidade-opcoes > div');
    visibilidades.forEach(opcao => {
        opcao.classList.remove('selecionado');
    });

    if (visibilidade === 'message') {
        document.querySelector('.mensagem-publica').classList.add('selecionado');
    } else {
        document.querySelector('.mensagem-privada').classList.add('selecionado');
    }
}

function enviarMensagemEntrada(nomeUsuario) {
    const mensagem = {
        from: nomeUsuario,
        to: "Todos",
        text: "entra na sala...",
        type: "status"
    };

    axios.post(`https://mock-api.driven.com.br/api/v6/uol/messages/${uuid}`, mensagem)
        .then(() => {
            console.log("Mensagem de entrada enviada com sucesso");
            carregarMensagens();
        })
        .catch((erro) => {
            console.error("Erro ao enviar mensagem de entrada:", erro);
        });
}


contatoTodos.addEventListener('click', () => selecionarDestinatario('Todos'));
mensagemPublica.addEventListener('click', () => selecionarVisibilidade('message'));
mensagemPrivada.addEventListener('click', () => selecionarVisibilidade('private_message'));

buscarUsuariosOnline();
obterNomeUsuario();

setInterval(manterConexao, 5000);
setInterval(buscarUsuariosOnline, 10000);
setInterval(carregarMensagens, 3000);
