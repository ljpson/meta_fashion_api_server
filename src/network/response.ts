interface DefaultResponse {
  status: number;
  message: string;
  data?: any;
}

interface SignInResponse extends DefaultResponse {
  policyAllow: boolean;
  pushAllow?: boolean;
  accountId: number;
  nickname: string;
  accessToken: string;
  provider?: string;
}

interface ContentListResponse extends DefaultResponse {
  command: {
    contents: [];
  };
}

interface CategoryListResponse extends DefaultResponse {
  data: []
}

interface DesignerListResponse extends DefaultResponse {
  data: []
}

