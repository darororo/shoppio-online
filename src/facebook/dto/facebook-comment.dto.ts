export interface FacebookCommentResponse {
  id: string;
  message: string;
  created_time: string;
  from: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
  };
  comments?: {
    data: FacebookCommentResponse[];
    paging?: {
      cursors: {
        before: string;
        after: string;
      };
      next?: string;
    };
  };
}

export interface FacebookCommentsListResponse {
  data: FacebookCommentResponse[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface FacebookPostCommentsResponse {
  comments: FacebookCommentsListResponse;
}
