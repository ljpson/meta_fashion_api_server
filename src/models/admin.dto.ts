interface AdminDto {
  id?: number;
  account?: string;
  name?: string;
  password?: string;
  part?: string;
  authority?: string;

  designerId?: number;
  status?: string;
  passwordChangeYn?: string;
  createBy?: string;
  createDate?: string;
  updateBy?: string;
  updateDate?: string;
}
