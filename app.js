const API_URL =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/projects'
    : 'https://app-pet-aulacoding-backend.onrender.com/api/projects';

const form = document.getElementById('project-form');
const projectId = document.getElementById('project-id');
const title = document.getElementById('title');
const description = document.getElementById('description');
const technologies = document.getElementById('technologies');
const softSkills = document.getElementById('softSkills');
const professor = document.getElementById('professor');
const semester = document.getElementById('semester');
const teamMembers = document.getElementById('teamMembers');
const coverImageInput = document.getElementById('coverImage');
const imagePreview = document.getElementById('image-preview');
const projectsList = document.getElementById('projects-list');
const message = document.getElementById('message');
const cancelEdit = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');
const reloadBtn = document.getElementById('reload-btn');

let coverImageData = '';

const MAX_IMAGE_MB = 2;

function showMessage(text) {
  message.textContent = text;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clearImagePreview() {
  imagePreview.innerHTML = 'Nenhuma imagem selecionada';
}

function renderImagePreview(src) {
  if (!src) {
    clearImagePreview();
    return;
  }

  imagePreview.innerHTML = `<img src="${src}" alt="Prévia da capa">`;
}

function clearForm() {
  form.reset();
  projectId.value = '';
  formTitle.textContent = 'Novo projeto';
  cancelEdit.classList.add('hidden');
  coverImageData = '';
  clearImagePreview();
}

function parseList(value) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item);
}

function parseTeamMembers(value) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      const parts = line.split('-');
      return {
        name: (parts[0] || '').trim(),
        role: (parts[1] || '').trim()
      };
    })
    .filter(member => member.name && member.role);
}

function teamMembersToText(members) {
  return (members || []).map(member => `${member.name} - ${member.role}`).join('\n');
}

function renderTags(items) {
  return (items || []).map(item => `<span class="tag">${escapeHtml(item)}</span>`).join('');
}

function renderTeamMembers(members) {
  return (members || [])
    .map(member => `<li><strong>${escapeHtml(member.name)}</strong> — ${escapeHtml(member.role)}</li>`)
    .join('');
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));

    reader.readAsDataURL(file);
  });
}

async function handleImageChange() {
  const file = coverImageInput.files[0];

  if (!file) {
    coverImageData = '';
    clearImagePreview();
    return;
  }

  if (!file.type.startsWith('image/')) {
    showMessage('Selecione um arquivo de imagem válido.');
    coverImageInput.value = '';
    return;
  }

  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    showMessage(`A imagem deve ter no máximo ${MAX_IMAGE_MB}MB.`);
    coverImageInput.value = '';
    return;
  }

  coverImageData = await readFileAsDataURL(file);
  renderImagePreview(coverImageData);
  showMessage('Imagem carregada.');
}

async function loadProjects() {
  try {
    const response = await fetch(API_URL);
    const projects = await response.json();

    if (!projects.length) {
      projectsList.innerHTML = '<p>Nenhum projeto encontrado.</p>';
      return;
    }

    projectsList.innerHTML = projects.map(project => `
      <div class="entry-item">
        ${project.coverImage ? `<img src="${project.coverImage}" alt="Capa do projeto ${escapeHtml(project.title)}" class="project-cover">` : ''}

        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <p><strong>Professor:</strong> ${escapeHtml(project.professor)}</p>
        <p><strong>Período:</strong> ${escapeHtml(project.semester)}</p>

        <div class="section-group">
          <h4>Tecnologias</h4>
          <div class="tags">${renderTags(project.technologies)}</div>
        </div>

        <div class="section-group">
          <h4>Soft skills</h4>
          <div class="tags">${renderTags(project.softSkills)}</div>
        </div>

        <div class="section-group">
          <h4>Integrantes</h4>
          <ul class="member-list">${renderTeamMembers(project.teamMembers)}</ul>
        </div>

        <div class="entry-buttons">
          <button onclick="editProject('${project._id}')">Editar</button>
          <button onclick="deleteProject('${project._id}')">Excluir</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    showMessage('Erro ao carregar projetos.');
  }
}

async function saveProject(data) {
  const id = projectId.value;
  const url = id ? `${API_URL}/${id}` : API_URL;
  const method = id ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const rawText = await response.text();
  let result = {};

  try {
    result = JSON.parse(rawText);
  } catch {
    result = {};
  }

  if (!response.ok) {
    console.error('ERRO DO BACKEND:', response.status, result, rawText);
    throw new Error(
      result.error ||
      result.message ||
      `Erro ${response.status} ao salvar projeto.`
    );
  }

  return result;
}

window.editProject = async function (id) {
  const response = await fetch(`${API_URL}/${id}`);
  const project = await response.json();

  projectId.value = project._id;
  title.value = project.title || '';
  description.value = project.description || '';
  technologies.value = (project.technologies || []).join(', ');
  softSkills.value = (project.softSkills || []).join(', ');
  professor.value = project.professor || '';
  semester.value = project.semester || '';
  teamMembers.value = teamMembersToText(project.teamMembers || []);
  coverImageData = project.coverImage || '';

  renderImagePreview(coverImageData);

  formTitle.textContent = 'Editar projeto';
  cancelEdit.classList.remove('hidden');
  showMessage('Editando projeto.');
};

window.deleteProject = async function (id) {
  if (!confirm('Deseja excluir este projeto?')) return;

  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  showMessage('Projeto excluído.');
  loadProjects();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    title: title.value.trim(),
    description: description.value.trim(),
    technologies: parseList(technologies.value),
    softSkills: parseList(softSkills.value),
    professor: professor.value.trim(),
    semester: semester.value.trim(),
    teamMembers: parseTeamMembers(teamMembers.value),
    coverImage: coverImageData
  };

  try {
    await saveProject(data);
    showMessage(projectId.value ? 'Projeto atualizado.' : 'Projeto criado.');
    clearForm();
    loadProjects();
  } catch (error) {
    showMessage(error.message);
    console.error(error);
  }
});

cancelEdit.addEventListener('click', () => {
  clearForm();
  showMessage('Edição cancelada.');
});

reloadBtn.addEventListener('click', loadProjects);
coverImageInput.addEventListener('change', handleImageChange);

clearForm();
loadProjects();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usar o caminho relativo garante que o GitHub Pages encontre o arquivo na subpasta
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registrado!', reg))
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  });
} 