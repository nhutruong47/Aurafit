const ROOT_CATEGORY_CONFIG = {
  cosplay: {
    key: 'cosplay',
    uiName: 'Cosplay',
    label: 'Cosplay',
  },
  'su-kien': {
    key: 'events',
    uiName: 'Events',
    label: 'Sự kiện',
  },
  'ky-yeu': {
    key: 'yearbook',
    uiName: 'Yearbook',
    label: 'Kỷ yếu',
  },
  'trang-phuc-truyen-thong': {
    key: 'traditional',
    uiName: 'Traditional',
    label: 'Trang phục truyền thống',
  },
  'phu-kien': {
    key: 'accessories',
    uiName: 'Accessories',
    label: 'Phụ kiện',
  },
};

const FALLBACK_KEYWORD_CONFIG = [
  { match: ['cosplay', 'anime', 'gaming', 'game', 'fantasy', 'character'], rootPath: 'cosplay' },
  { match: ['event', 'sự kiện', 'formal', 'gala', 'prom', 'wedding', 'vest'], rootPath: 'su-kien' },
  {
    match: ['traditional', 'truyền thống', 'áo dài', 'kimono', 'hanbok', 'yukata', 'hakama', 'hán phục', 'sườn xám'],
    rootPath: 'trang-phuc-truyen-thong',
  },
  { match: ['yearbook', 'kỷ yếu', 'graduation', 'vintage'], rootPath: 'ky-yeu' },
  { match: ['accessor', 'phụ kiện', 'wig', 'shoe', 'jewelry', 'weapon', 'makeup'], rootPath: 'phu-kien' },
];

export const categoryLabels = {
  Cosplay: 'Cosplay',
  Events: 'Sự kiện',
  Event: 'Sự kiện',
  Yearbook: 'Kỷ yếu',
  'Kỷ yếu': 'Kỷ yếu',
  Traditional: 'Trang phục truyền thống',
  'Trang phục truyền thống': 'Trang phục truyền thống',
  Accessories: 'Phụ kiện',
  'Phụ kiện': 'Phụ kiện',
};

export function getRootCategoryPath(categoryPath) {
  if (!categoryPath || typeof categoryPath !== 'string') {
    return null;
  }

  const normalizedPath = categoryPath.trim().toLowerCase();
  if (!normalizedPath) {
    return null;
  }

  return normalizedPath.split('/')[0] || null;
}

function resolveFallbackRootPath(text) {
  if (!text) {
    return null;
  }

  const normalizedText = text.toLowerCase();
  const match = FALLBACK_KEYWORD_CONFIG.find((entry) =>
    entry.match.some((keyword) => normalizedText.includes(keyword))
  );

  return match?.rootPath || null;
}

export function resolveRootCategory(categoryPath, ...fallbackTexts) {
  const rootPath = getRootCategoryPath(categoryPath);
  const configuredRoot = rootPath ? ROOT_CATEGORY_CONFIG[rootPath] : null;
  if (configuredRoot) {
    return {
      rootPath,
      ...configuredRoot,
    };
  }

  const fallbackRootPath = resolveFallbackRootPath(fallbackTexts.filter(Boolean).join(' '));
  const fallbackRoot = fallbackRootPath ? ROOT_CATEGORY_CONFIG[fallbackRootPath] : null;

  if (fallbackRoot) {
    return {
      rootPath: fallbackRootPath,
      ...fallbackRoot,
    };
  }

  return {
    rootPath: null,
    key: null,
    uiName: '',
    label: '',
  };
}

export function flattenCategoryTree(nodes, parentPath = null, depth = 0) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  return nodes.flatMap((node) => {
    const currentNode = {
      ...node,
      parentPath,
      depth,
    };

    return [currentNode, ...flattenCategoryTree(node.children || [], node.path || null, depth + 1)];
  });
}

export function buildAncestorPaths(categoryPath, categoriesByPath) {
  const ancestorPaths = [];
  let currentPath = categoryPath;

  while (currentPath) {
    ancestorPaths.unshift(currentPath);
    currentPath = categoriesByPath.get(currentPath)?.parentPath || null;
  }

  return ancestorPaths;
}

export function buildSelectedCategoryState(categoryPath, categoriesByPath, tag = null) {
  if (!categoryPath) {
    return {
      categoryPath: null,
      category: null,
      subcategory: null,
      tag,
    };
  }

  const selectedCategory = categoriesByPath.get(categoryPath);
  if (!selectedCategory) {
    return {
      categoryPath,
      category: null,
      subcategory: null,
      tag,
    };
  }

  const ancestorPaths = buildAncestorPaths(categoryPath, categoriesByPath);
  const rootCategory = ancestorPaths.length > 0 ? categoriesByPath.get(ancestorPaths[0]) : selectedCategory;

  return {
    categoryPath,
    category: rootCategory?.name || selectedCategory.name,
    subcategory:
      rootCategory?.path && rootCategory.path !== selectedCategory.path ? selectedCategory.name : null,
    tag,
  };
}
