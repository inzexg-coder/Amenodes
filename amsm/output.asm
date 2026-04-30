OUTPUT_NODE_SIZE    EQU 64
OUTPUT_ROWS_PTR     EQU 32 
OUTPUT_ROWS_COUNT   EQU 40  
OUTPUT_DIRTY        EQU 48 
OUTPUT_TITLE_PTR    EQU 52   
OUTPUT_TITLE_LEN    EQU 60 

OUTPUT_TYPE EQU 5

ROW_SIZE       EQU 24
ROW_PARAM_PTR  EQU 0    
ROW_PARAM_LEN  EQU 8   
ROW_VALUE_PTR  EQU 16  

MAX_STR_LEN    EQU 32

output_free_rows:
    push rbp
    mov rbp, rsp
    push rbx
    push r12
    push r13
    
    mov rbx, rdi                    
    mov r12, [rbx + OUTPUT_ROWS_PTR] 
    mov r13, [rbx + OUTPUT_ROWS_COUNT]
    
    test r12, r12
    jz .free_done
    
    xor rcx, rcx            
.loop_free:
    cmp rcx, r13
    jge .free_array
    
    mov rdi, [r12 + rcx*ROW_SIZE + ROW_PARAM_PTR]
    test rdi, rdi
    jz .skip_param
    call free
.skip_param:
    
    mov rdi, [r12 + rcx*ROW_SIZE + ROW_VALUE_PTR]
    test rdi, rdi
    jz .skip_value
    call free
.skip_value:
    
    inc rcx
    jmp .loop_free
    
.free_array:
    mov rdi, r12
    call free
    mov qword [rbx + OUTPUT_ROWS_PTR], 0
    
.free_done:
    mov qword [rbx + OUTPUT_ROWS_COUNT], 0
    
    pop r13
    pop r12
    pop rbx
    pop rbp
    ret

format_double:
    push rbp
    mov rbp, rsp
    sub rsp, MAX_STR_LEN
    
    ; выделяем буфер
    mov rdi, MAX_STR_LEN
    call malloc
    test rax, rax
    jz .fail

    mov rcx, rax
    mov byte [rcx], '0'
    mov byte [rcx+1], '.'
    mov byte [rcx+2], '0'
    mov byte [rcx+3], '0'
    mov byte [rcx+4], '0'
    mov byte [rcx+5], '0'
    mov byte [rcx+6], '0'
    mov byte [rcx+7], '0'
    mov byte [rcx+8], 0
    jmp .done
.fail:
    xor rax, rax
.done:
    leave
    ret

make_param_string:
    push rbp
    mov rbp, rsp
    sub rsp, 32
    
    mov rdi, 32
    call malloc
    test rax, rax
    jz .fail
    
    mov r8, rax                 
    mov r9, rdi                    
    
    mov rcx, r8
    mov byte [rcx],   'з'
    mov byte [rcx+1], 'н'
    mov byte [rcx+2], 'а'
    mov byte [rcx+3], 'ч'
    mov byte [rcx+4], 'е'
    mov byte [rcx+5], 'н'
    mov byte [rcx+6], 'и'
    mov byte [rcx+7], 'е'
    mov byte [rcx+8], ' '
    mov byte [rcx+9], 0
    
    mov rdx, r9
    add dl, '0'                     
    mov byte [rcx+9], dl
    mov byte [rcx+10], 0
    
    jmp .done
.fail:
    xor rax, rax
.done:
    leave
    ret

output_update:
    push rbp
    mov rbp, rsp
    push rbx
    push r12
    push r13
    push r14
    push r15
    
    mov rbx, rdi                     ; node
    cmp byte [rbx + OUTPUT_DIRTY], 0
    je .already_clean

    call output_free_rows
    

    call output_fetch_input      
    test rcx, rcx
    jz .no_input
    
    mov r12, rax                     ; ptr array
    mov r13, rcx                     ; length
    
    mov rdi, r13
    shl rdi, 4                      
    shl rdi, 1                 
    call malloc
    test rax, rax
    jz .cleanup_input
    mov [rbx + OUTPUT_ROWS_PTR], rax
    mov [rbx + OUTPUT_ROWS_COUNT], r13
    
    mov r14, rax                     ; rows array pointer
    xor r15, r15                     
    
.loop_rows:
    cmp r15, r13
    jge .done
    
    mov rdi, r15
    inc rdi                          
    call make_param_string
    mov [r14 + r15*ROW_SIZE + ROW_PARAM_PTR], rax
    mov qword [r14 + r15*ROW_SIZE + ROW_PARAM_LEN], 32
    
    movsd xmm0, qword [r12 + r15*8]  
    
    ucomisd xmm0, xmm0          
    jp .is_nan
    jmp .format_value
    
.is_nan:
    ; строка для NaN
    mov rdi, 4
    call malloc
    test rax, rax
    jz .skip_format
    mov rcx, rax
    mov byte [rcx], 'N'
    mov byte [rcx+1], 'a'
    mov byte [rcx+2], 'N'
    mov byte [rcx+3], 0
    jmp .store_value
    
.format_value:
    call format_double
    
.store_value:
    mov [r14 + r15*ROW_SIZE + ROW_VALUE_PTR], rax
    
.skip_format:
    inc r15
    jmp .loop_rows

.no_input:
    mov rdi, 1                     
    shl rdi, 4                     
    call malloc
    test rax, rax
    jz .cleanup_input
    mov [rbx + OUTPUT_ROWS_PTR], rax
    mov qword [rbx + OUTPUT_ROWS_COUNT], 1
    

    mov rdi, 14                    
    call malloc
    test rax, rax
    jz .cleanup_input
    mov rcx, rax
    ; + str copy
    
    mov r14, [rbx + OUTPUT_ROWS_PTR]
    mov [r14 + ROW_PARAM_PTR], rax
    mov qword [r14 + ROW_PARAM_LEN], 11
    
    mov rdi, 2
    call malloc
    test rax, rax
    jz .cleanup_input
    mov rcx, rax
    mov byte [rcx], '—'
    mov byte [rcx+1], 0
    mov [r14 + ROW_VALUE_PTR], rax
    
    jmp .done

.cleanup_input:
    call output_free_rows
    
.done:
    test r12, r12
    jz .skip_input_free
    mov rdi, r12
    call free
.skip_input_free:
    mov byte [rbx + OUTPUT_DIRTY], 0
.already_clean:
    pop r15
    pop r14
    pop r13
    pop r12
    pop rbx
    pop rbp
    ret

output_render:
    push rbp
    mov rbp, rsp
    
    cmp byte [rdi + OUTPUT_DIRTY], 0
    je .skip_update
    call output_update
    
.skip_update:
    
    mov rbx, rdi                     ; node
    mov rsi, [rbx + OUTPUT_ROWS_PTR]
    mov rcx, [rbx + OUTPUT_ROWS_COUNT]
    test rsi, rsi
    jz .no_display

.no_display:
    pop rbp
    ret

output_invalidate:
    mov byte [rdi + OUTPUT_DIRTY], 1
    ret

output_get_title:
    push rbp
    mov rbp, rsp
    sub rsp, 64
    
    cmp byte [rdi + OUTPUT_DIRTY], 0
    je .use_cached
    call output_update
    
.use_cached:
    mov rbx, rdi
    mov rcx, [rbx + OUTPUT_ROWS_COUNT]
    
    mov rdi, 32
    call malloc
    test rax, rax
    jz .fail
    
    mov r8, rax
    ; + str output
    
    mov rdx, [rbx + OUTPUT_ROWS_COUNT]
    add dl, '0'                      ; only 0-9
    mov byte [rcx+7], dl

    ; + str value
    
    jmp .done
.fail:
    xor rax, rax
.done:
    leave
    ret
