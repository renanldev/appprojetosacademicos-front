const API_URL = 'https://app-pet-aulacoding-backend.onrender.com/api/projects';

const form = document.getElementById('project-form');
const projectId = document.getElementById('project-id');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const disciplineInput = document.getElementById('discipline');
const professorInput = document.getElementById('professor');
const technologiesInput = document.getElementById('technologies');
const softSkillsInput = document.getElementById('softSkills');
const teamMembersInput = document.getElementById('teamMembers');
const coverImageInput = document.getElementById('coverImage');
const demoVideoInput = document.getElementById('demoVideo');
const imagePreview = document.getElementById('image-preview');
const videoPreview = document.getElementById('video-preview');
const projectsList = document.getElementById('projects-list');
const message = document.getElementById('message');
const cancelEdit = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');
const reloadBtn = document.getElementById('reload-btn');
const periodInputs = document.querySelectorAll('input[name="period"]');

let coverImageData = '';
let demoVideoData = '';

const MAX_IMAGE_MB = 2;
const MAX_VIDEO_MB = 5;

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

function parseList(value) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseTeamMembers(value) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('-');
      const name = (parts.shift() || '').trim();
      const role = parts.join('-').trim();

      return { name, role };
    })
    .filter(member => member.name && member.role);
}

function teamMembersToText(members) {
  return (members || [])
    .map(member => `${member.name} - ${member.role}`)
    .join('\n');
}

function getSelectedPeriod() {
  const selected = document.querySelector('input[name="period"]:checked');
  return selected ? selected.value : '';
}

function setSelectedPeriod(value) {
  periodInputs.forEach(input => {
    input.checked = input.value === String(value);
  });
}

function clearImagePreview() {
  imagePreview.innerHTML = '<span>Nenhuma imagem selecionada</span>';
}

function clearVideoPreview() {
  videoPreview.innerHTML = '<span>Nenhum vídeo selecionado</span>';
}

function renderImagePreview(src) {
  if (!src) {
    clearImagePreview();
    return;
  }

  imagePreview.innerHTML = `<img src="${src}" alt="Capa do projeto">`;
}

function renderVideoPreview(src) {
  if (!src) {
    clearVideoPreview();
    return;
  }

  videoPreview.innerHTML = `<video src="${src}" controls preload="metadata"></video>`;
}

function clearForm() {
  form.reset();
  projectId.value = '';
  formTitle.textContent = 'Novo projeto';
  cancelEdit.classList.add('hidden');
  setSelectedPeriod('');
  coverImageData = '';
  demoVideoData = '';
  clearImagePreview();
  clearVideoPreview();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));

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

async function handleVideoChange() {
  const file = demoVideoInput.files[0];

  if (!file) {
    demoVideoData = '';
    clearVideoPreview();
    return;
  }

  if (!file.type.startsWith('video/')) {
    showMessage('Selecione um arquivo de vídeo válido.');
    demoVideoInput.value = '';
    return;
  }

  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    showMessage(`O vídeo deve ter no máximo ${MAX_VIDEO_MB}MB.`);
    demoVideoInput.value = '';
    return;
  }

  demoVideoData = await readFileAsDataURL(file);
  renderVideoPreview(demoVideoData);
  showMessage('Vídeo carregado.');
}

function renderTags(items) {
  return (items || [])
    .map(item => `<span class="tag">${escapeHtml(item)}</span>`)
    .join('');
}

function renderTeamMembers(members) {
  if (!members || !members.length) {
    return '<p>Nenhum integrante informado.</p>';
  }

  return `
    <ul class="member-list">
      ${members
        .map(member => `<li><strong>${escapeHtml(member.name)}</strong> — ${escapeHtml(member.role)}</li>`)
        .join('')}
    </ul>
  `;
}

function renderMedia(project) {
  if (!project.coverImage && !project.demoVideo) {
    return '<p>Nenhuma mídia cadastrada.</p>';
  }

  return `
    <div class="card-media">
      ${project.coverImage ? `<img src="${project.coverImage}" alt="Capa de ${escapeHtml(project.title)}">` : ''}
      ${project.demoVideo ? `<video src="${project.demoVideo}" controls preload="metadata"></video>` : ''}
    </div>
  `;
}

function renderProjectCard(project) {
  return `
    <article class="project-card">
      <div class="project-card-top">
        <div class="project-cover">
          ${
            project.coverImage
              ? `<img src="${project.coverImage}" alt="Capa do projeto ${escapeHtml(project.title)}">`
              : `<div class="project-cover-placeholder">Sem capa cadastrada</div>`
          }
        </div>

        <div class="project-content">
          <div class="project-meta">
            <span class="meta-pill">${escapeHtml(project.discipline)}</span>
            <span class="meta-pill">${escapeHtml(project.period)}º período</span>
            <span class="meta-pill">${formatDate(project.createdAt)}</span>
          </div>

          <h3 class="project-title">${escapeHtml(project.title)}</h3>
          <p class="project-description">${escapeHtml(project.description)}</p>

          <div class="project-facts">
            <div class="fact-box">
              <span>Professor</span>
              <strong>${escapeHtml(project.professor)}</strong>
            </div>

            <div class="fact-box">
              <span>Integrantes</span>
              <strong>${project.teamMembers?.length || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="card-accordions">
        <details class="card-accordion">
          <summary>Tecnologias</summary>
          <div class="card-accordion-body">
            <div class="tags">${renderTags(project.technologies)}</div>
          </div>
        </details>

        <details class="card-accordion">
          <summary>Soft skills</summary>
          <div class="card-accordion-body">
            <div class="tags">${renderTags(project.softSkills)}</div>
          </div>
        </details>

        <details class="card-accordion">
          <summary>Equipe / autoria</summary>
          <div class="card-accordion-body">
            ${renderTeamMembers(project.teamMembers)}
          </div>
        </details>

        <details class="card-accordion">
          <summary>Mídia do projeto</summary>
          <div class="card-accordion-body">
            ${renderMedia(project)}
          </div>
        </details>
      </div>

      <div class="card-actions">
        <button class="edit-btn" onclick="editProject('${project._id}')">Editar</button>
        <button class="delete-btn" onclick="deleteProject('${project._id}')">Excluir</button>
      </div>
    </article>
  `;
}

async function loadProjects() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error('Não foi possível carregar os projetos.');
    }

    const projects = await response.json();

    if (!projects.length) {
      projectsList.innerHTML = '<p>Nenhum projeto encontrado.</p>';
      return;
    }

    projectsList.innerHTML = projects.map(renderProjectCard).join('');
  } catch (error) {
    projectsList.innerHTML = '<p>Erro ao carregar os projetos.</p>';
    showMessage(error.message);
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

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || 'Erro ao salvar projeto.');
  }

  return result;
}

window.editProject = async function (id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
      throw new Error('Não foi possível carregar o projeto para edição.');
    }

    const project = await response.json();

    projectId.value = project._id;
    titleInput.value = project.title || '';
    descriptionInput.value = project.description || '';
    disciplineInput.value = project.discipline || '';
    professorInput.value = project.professor || '';
    technologiesInput.value = (project.technologies || []).join(', ');
    softSkillsInput.value = (project.softSkills || []).join(', ');
    teamMembersInput.value = teamMembersToText(project.teamMembers || []);
    setSelectedPeriod(project.period || '');

    coverImageData = project.coverImage || '';
    demoVideoData = project.demoVideo || '';

    renderImagePreview(coverImageData);
    renderVideoPreview(demoVideoData);

    formTitle.textContent = 'Editar projeto';
    cancelEdit.classList.remove('hidden');
    showMessage('Editando projeto.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showMessage(error.message);
  }
};

window.deleteProject = async function (id) {
  if (!confirm('Deseja excluir este projeto?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Não foi possível excluir o projeto.');
    }

    showMessage('Projeto excluído.');
    loadProjects();
  } catch (error) {
    showMessage(error.message);
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const period = getSelectedPeriod();
  const teamMembers = parseTeamMembers(teamMembersInput.value);

  if (!period) {
    showMessage('Selecione o período do projeto.');
    return;
  }

  if (!teamMembers.length) {
    showMessage('Informe pelo menos um integrante com nome e função.');
    return;
  }

  const data = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    discipline: disciplineInput.value.trim(),
    professor: professorInput.value.trim(),
    period,
    technologies: parseList(technologiesInput.value),
    softSkills: parseList(softSkillsInput.value),
    teamMembers,
    coverImage: coverImageData,
    demoVideo: demoVideoData
  };

  try {
    await saveProject(data);
    showMessage(projectId.value ? 'Projeto atualizado.' : 'Projeto criado.');
    clearForm();
    loadProjects();
  } catch (error) {
    showMessage(error.message);
  }
});

cancelEdit.addEventListener('click', () => {
  clearForm();
  showMessage('Edição cancelada.');
});

reloadBtn.addEventListener('click', loadProjects);
coverImageInput.addEventListener('change', handleImageChange);
demoVideoInput.addEventListener('change', handleVideoChange);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
    } catch (error) {
      console.log('Erro ao registrar Service Worker:', error);
    }
  });
}

clearForm();
loadProjects();